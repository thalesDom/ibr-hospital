<?php
// IBR Hospital — api/servicos.php

set_error_handler(function($errno, $errstr) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => "PHP Error [$errno]: $errstr"]);
    exit;
});

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

try {
    require_once 'config.php';
} catch (Throwable $e) {
    error_log('[IBR] ' . $e->getMessage()); echo json_encode(['success' => false, 'message' => 'Erro ao carregar config.']);
    exit;
}

// ── Usa getDB() do config.php ──
try {
    $pdo = getDB();
} catch (Throwable $e) {
    error_log('[IBR] ' . $e->getMessage()); echo json_encode(['success' => false, 'message' => 'Erro de conexão com o banco.']);
    exit;
}

// ── Cria a tabela automaticamente se não existir ──
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `servicos_medicos` (
        `id`             INT           NOT NULL AUTO_INCREMENT,
        `titulo`         VARCHAR(120)  NOT NULL,
        `desc_curta`     VARCHAR(200)  NOT NULL,
        `desc_completa`  TEXT          NOT NULL,
        `imagem`         VARCHAR(500)  NOT NULL,
        `ordem`          TINYINT       NOT NULL DEFAULT 1,
        `status`         ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
        `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (Throwable $e) {
    error_log('[IBR] ' . $e->getMessage()); echo json_encode(['success' => false, 'message' => 'Erro ao criar tabela.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

// ── Exige login + permissão pra qualquer alteração (POST) ──
if ($method !== 'GET') {
    startSession();
    if (!isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Não autorizado.']);
        exit;
    }
    requirePermission('servicos');
}

// ── GET ──
if ($method === 'GET') {
    try {
        startSession();
        $podeVerTudo = isLoggedIn() && (($_SESSION['usuario_nivel'] ?? '') === 'admin' || in_array('servicos', $_SESSION['usuario_permissoes'] ?? [], true));
        if ($podeVerTudo) {
            $rows = $pdo->query("SELECT * FROM servicos_medicos ORDER BY ordem ASC, id ASC")->fetchAll();
        } else {
            $rows = $pdo->query("SELECT * FROM servicos_medicos WHERE status='ativo' ORDER BY ordem ASC, id ASC")->fetchAll();
        }
        echo json_encode(['success' => true, 'data' => $rows]);
    } catch (Throwable $e) {
        error_log('[IBR] ' . $e->getMessage()); echo json_encode(['success' => false, 'message' => 'Erro ao buscar.']);
    }
    exit;
}

// ── POST (cria OU atualiza — o form do painel sempre manda POST com
//    FormData pra poder anexar arquivo; "id" presente = edição) ──
if ($method === 'POST') {
    try {
        $id            = intval($_POST['id'] ?? 0);
        $titulo        = trim($_POST['titulo']        ?? '');
        $desc_curta    = trim($_POST['desc_curta']    ?? '');
        $desc_completa = trim($_POST['desc_completa'] ?? '');
        $ordem         = intval($_POST['ordem']       ?? 1);
        $status        = in_array($_POST['status'] ?? '', ['ativo','inativo']) ? $_POST['status'] : 'ativo';

        $novaImagem = handleImageUpload('imagem_arquivo', 'servicos');
        $imagem = $novaImagem ?? trim($_POST['imagem_atual'] ?? '');

        if (!$titulo || !$desc_curta || !$desc_completa || !$imagem) {
            echo json_encode(['success' => false, 'message' => 'Campos obrigatórios faltando.']);
            exit;
        }

        if ($id) {
            $stmt = $pdo->prepare("UPDATE servicos_medicos SET titulo=?, desc_curta=?, desc_completa=?, imagem=?, ordem=?, status=?, updated_at=NOW() WHERE id=?");
            $stmt->execute([$titulo, $desc_curta, $desc_completa, $imagem, $ordem, $status, $id]);
            echo json_encode(['success' => true]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO servicos_medicos (titulo, desc_curta, desc_completa, imagem, ordem, status) VALUES (?,?,?,?,?,?)");
            $stmt->execute([$titulo, $desc_curta, $desc_completa, $imagem, $ordem, $status]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
    } catch (Throwable $e) {
        error_log('[IBR] ' . $e->getMessage()); echo json_encode(['success' => false, 'message' => 'Erro ao salvar.']);
    }
    exit;
}

// ── DELETE ──
if ($method === 'DELETE') {
    try {
        $id = intval($input['id'] ?? 0);
        if (!$id) { echo json_encode(['success' => false, 'message' => 'ID inválido.']); exit; }
        $pdo->prepare("DELETE FROM servicos_medicos WHERE id=?")->execute([$id]);
        echo json_encode(['success' => true]);
    } catch (Throwable $e) {
        error_log('[IBR] ' . $e->getMessage()); echo json_encode(['success' => false, 'message' => 'Erro ao excluir.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método não permitido.']);