<?php
// IBR Hospital — api/documentos.php  (Documentos Institucionais)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

try {
    require_once 'config.php';
    $pdo = getDB();
    $pdo->exec("CREATE TABLE IF NOT EXISTS `documentos` (
        `id`         INT          NOT NULL AUTO_INCREMENT,
        `titulo`     VARCHAR(200) NOT NULL,
        `arquivo`    VARCHAR(500) NOT NULL,
        `ordem`      INT          NOT NULL DEFAULT 1,
        `status`     ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
        `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (Throwable $e) {
    error_log('[IBR] ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erro de conexão com o banco.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method !== 'GET') {
    startSession();
    if (!isLoggedIn()) { http_response_code(401); echo json_encode(['success' => false, 'message' => 'Não autorizado.']); exit; }
    requirePermission('documentos');
}

// Salva o arquivo enviado (PDF, Word ou Excel) e devolve a URL pública; null se nada foi enviado.
function salvarDocumento(string $campo): ?string {
    if (empty($_FILES[$campo]['name'])) return null;
    $f = $_FILES[$campo];
    if ($f['error'] !== UPLOAD_ERR_OK) json(false, [], 'Erro ao enviar o arquivo.');
    if ($f['size'] > 15 * 1024 * 1024) json(false, [], 'Arquivo muito grande (máx 15MB).');
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['pdf', 'doc', 'docx', 'xls', 'xlsx'], true)) json(false, [], 'Formato inválido. Use PDF, Word (doc/docx) ou Excel (xls/xlsx).');
    $ini = file_get_contents($f['tmp_name'], false, null, 0, 8);
    $ok = match ($ext) {
        'pdf'          => str_starts_with($ini, '%PDF'),
        'docx', 'xlsx' => str_starts_with($ini, "PK\x03\x04"),
        default        => str_starts_with($ini, "\xD0\xCF\x11\xE0"),
    };
    if (!$ok) json(false, [], 'O conteúdo do arquivo não corresponde ao formato.');
    $dir = __DIR__ . '/../uploads/documentos/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $nome = 'doc_' . bin2hex(random_bytes(8)) . '.' . $ext;
    move_uploaded_file($f['tmp_name'], $dir . $nome);
    return '/uploads/documentos/' . $nome;
}

function apagarArquivo(string $url): void {
    if (strpos($url, '/uploads/documentos/') !== 0) return;
    $p = __DIR__ . '/..' . $url;
    if (is_file($p)) @unlink($p);
}

if ($method === 'GET') {
    try {
        startSession();
        $tudo = isLoggedIn() && (($_SESSION['usuario_nivel'] ?? '') === 'admin' || in_array('documentos', $_SESSION['usuario_permissoes'] ?? [], true));
        $sql = $tudo ? "SELECT * FROM documentos ORDER BY ordem ASC, id ASC"
                     : "SELECT * FROM documentos WHERE status='ativo' ORDER BY ordem ASC, id ASC";
        echo json_encode(['success' => true, 'data' => $pdo->query($sql)->fetchAll()]);
    } catch (Throwable $e) {
        error_log('[IBR] ' . $e->getMessage()); echo json_encode(['success' => false, 'message' => 'Erro ao buscar.']);
    }
    exit;
}

if ($method === 'POST') {
    try {
        $id     = intval($_POST['id'] ?? 0);
        $titulo = trim($_POST['titulo'] ?? '');
        $ordem  = intval($_POST['ordem'] ?? 1);
        $status = in_array($_POST['status'] ?? '', ['ativo', 'inativo'], true) ? $_POST['status'] : 'ativo';
        if ($titulo === '' || mb_strlen($titulo) > 200) { echo json_encode(['success' => false, 'message' => 'Informe o título (até 200 caracteres).']); exit; }

        $novo = salvarDocumento('arquivo');
        if ($id) {
            $atual = $pdo->prepare("SELECT arquivo FROM documentos WHERE id=?"); $atual->execute([$id]);
            $velho = $atual->fetchColumn();
            if ($velho === false) { echo json_encode(['success' => false, 'message' => 'Documento não encontrado.']); exit; }
            $arquivo = $novo ?? $velho;
            $pdo->prepare("UPDATE documentos SET titulo=?, arquivo=?, ordem=?, status=? WHERE id=?")->execute([$titulo, $arquivo, $ordem, $status, $id]);
            if ($novo && $velho) apagarArquivo($velho);
            echo json_encode(['success' => true]);
        } else {
            if (!$novo) { echo json_encode(['success' => false, 'message' => 'Envie o arquivo do documento.']); exit; }
            $pdo->prepare("INSERT INTO documentos (titulo, arquivo, ordem, status) VALUES (?,?,?,?)")->execute([$titulo, $novo, $ordem, $status]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
    } catch (Throwable $e) {
        error_log('[IBR] ' . $e->getMessage()); echo json_encode(['success' => false, 'message' => 'Erro ao salvar.']);
    }
    exit;
}

if ($method === 'DELETE') {
    try {
        $id = intval($input['id'] ?? 0);
        if (!$id) { echo json_encode(['success' => false, 'message' => 'ID inválido.']); exit; }
        $s = $pdo->prepare("SELECT arquivo FROM documentos WHERE id=?"); $s->execute([$id]);
        $arq = $s->fetchColumn();
        $pdo->prepare("DELETE FROM documentos WHERE id=?")->execute([$id]);
        if ($arq) apagarArquivo($arq);
        echo json_encode(['success' => true]);
    } catch (Throwable $e) {
        error_log('[IBR] ' . $e->getMessage()); echo json_encode(['success' => false, 'message' => 'Erro ao excluir.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
