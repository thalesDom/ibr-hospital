<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    $db = getDB();

    // ── Público: listar vagas abertas ─────────────────────
    if ($action === 'publicas') {
        $rows = $db->query("SELECT id,titulo,departamento,tipo,descricao,requisitos,salario FROM vagas WHERE ativo=1 ORDER BY created_at DESC")->fetchAll();
        json(true, ['vagas' => $rows]);
    }

    // ── Público: enviar currículo ─────────────────────────
    if ($action === 'curriculo' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        limitarEnvios('curriculo', 8, 600);
        $nome     = trim($_POST['nome'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $telefone = trim($_POST['telefone'] ?? '');
        $vaga_id  = (int)($_POST['vaga_id'] ?? 0) ?: null;
        $mensagem = trim($_POST['mensagem'] ?? '');

        if (!$nome || !$email) json(false, [], 'Nome e email obrigatórios.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json(false, [], 'E-mail inválido.');
        // limites de tamanho (evita lotar o banco com textos gigantes)
        if (mb_strlen($nome) > 200 || mb_strlen($email) > 255 || mb_strlen($telefone) > 30) json(false, [], 'Dados muito longos.');
        if (mb_strlen($mensagem) > 5000) json(false, [], 'Mensagem muito longa (máx 5000 caracteres).');
        if ($vaga_id) {
            $chk = $db->prepare("SELECT id FROM vagas WHERE id=? AND ativo=1");
            $chk->execute([$vaga_id]);
            if (!$chk->fetch()) json(false, [], 'Esta vaga não está mais disponível.');
        }

        $arquivo = null;
        if (!empty($_FILES['curriculo']['name'])) {
            if (($_FILES['curriculo']['error'] ?? 0) !== UPLOAD_ERR_OK) json(false, [], 'Erro ao enviar o arquivo. Tente novamente.');
            $ext = strtolower(pathinfo($_FILES['curriculo']['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['pdf','doc','docx'], true)) json(false, [], 'Formato inválido. Use PDF, DOC ou DOCX.');
            if ($_FILES['curriculo']['size'] > 5 * 1024 * 1024) json(false, [], 'Arquivo muito grande (máx 5MB).');

            // confere o CONTEÚDO do arquivo, não só a extensão (evita um .php renomeado para .pdf)
            // (verifica os primeiros bytes — a "assinatura" de cada formato — sem depender de extensões do PHP)
            $assinaturas = [
                'pdf'  => ["%PDF-"],
                'doc'  => ["\xD0\xCF\x11\xE0"],   // formato antigo do Word (OLE)
                'docx' => ["PK\x03\x04"],          // .docx é um zip
            ];
            $cabecalho = (string)@file_get_contents($_FILES['curriculo']['tmp_name'], false, null, 0, 8);
            $assinaturaOk = false;
            foreach ($assinaturas[$ext] as $a) {
                if (strncmp($cabecalho, $a, strlen($a)) === 0) { $assinaturaOk = true; break; }
            }
            if (!$assinaturaOk) json(false, [], 'O conteúdo do arquivo não corresponde ao formato informado.');

            if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
            $filename = 'cv_' . bin2hex(random_bytes(12)) . '.' . $ext;   // nome imprevisível
            if (!move_uploaded_file($_FILES['curriculo']['tmp_name'], UPLOAD_DIR . $filename)) {
                json(false, [], 'Não foi possível salvar o arquivo. Tente novamente.');
            }
            $arquivo = $filename;
        }

        $db->prepare("INSERT INTO curriculos(vaga_id,nome,email,telefone,arquivo,mensagem) VALUES(?,?,?,?,?,?)")
           ->execute([$vaga_id,$nome,$email,$telefone,$arquivo,$mensagem]);

        json(true, [], 'Currículo enviado com sucesso! Entraremos em contato.');
    }

    // ── Protegido ─────────────────────────────────────────
    startSession();
    if (!isLoggedIn()) json(false, [], 'Não autorizado.');

    // Esse arquivo serve duas telas do painel (Vagas e Currículos),
    // cada uma com sua própria permissão.
    if (in_array($action, ['lista','get','salvar','excluir_vaga','toggle_vaga'], true)) requirePermission('vagas');
    if (in_array($action, ['curriculos','marcar_lido','excluir_curriculo','baixar_curriculo'], true)) requirePermission('curriculos');

    switch ($action) {
        case 'lista':
            $rows = $db->query("SELECT * FROM vagas ORDER BY created_at DESC")->fetchAll();
            json(true, ['vagas' => $rows]);
            break;

        case 'get':
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $db->prepare("SELECT * FROM vagas WHERE id=?");
            $stmt->execute([$id]);
            $v = $stmt->fetch();
            if (!$v) json(false, [], 'Não encontrada.');
            json(true, ['vaga' => $v]);
            break;

        case 'salvar':
            $id          = (int)($_POST['id'] ?? 0);
            $titulo      = trim($_POST['titulo'] ?? '');
            $depto       = trim($_POST['departamento'] ?? '');
            $tipo        = trim($_POST['tipo'] ?? 'CLT');
            $descricao   = trim($_POST['descricao'] ?? '');
            $requisitos  = trim($_POST['requisitos'] ?? '');
            $salario     = trim($_POST['salario'] ?? '');
            $ativo       = (int)($_POST['ativo'] ?? 1);

            if (!$titulo || !$depto) json(false, [], 'Título e departamento obrigatórios.');

            if ($id > 0) {
                $db->prepare("UPDATE vagas SET titulo=?,departamento=?,tipo=?,descricao=?,requisitos=?,salario=?,ativo=?,updated_at=NOW() WHERE id=?")
                   ->execute([$titulo,$depto,$tipo,$descricao,$requisitos,$salario,$ativo,$id]);
                json(true, [], 'Vaga atualizada.');
            } else {
                $db->prepare("INSERT INTO vagas(titulo,departamento,tipo,descricao,requisitos,salario,ativo) VALUES(?,?,?,?,?,?,?)")
                   ->execute([$titulo,$depto,$tipo,$descricao,$requisitos,$salario,$ativo]);
                json(true, ['id' => $db->lastInsertId()], 'Vaga criada.');
            }
            break;

        case 'excluir_vaga':
            $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
            $db->prepare("DELETE FROM vagas WHERE id=?")->execute([$id]);
            json(true, [], 'Vaga excluída.');
            break;

        case 'toggle_vaga':
            $id = (int)($_POST['id'] ?? 0);
            $db->prepare("UPDATE vagas SET ativo = NOT ativo WHERE id=?")->execute([$id]);
            json(true, [], 'Status alterado.');
            break;

        case 'curriculos':
            $vaga_id = (int)($_GET['vaga_id'] ?? 0);
            $lido    = $_GET['lido'] ?? null;
            $where   = 'WHERE 1=1';
            $params  = [];
            if ($vaga_id) { $where .= ' AND c.vaga_id=?'; $params[] = $vaga_id; }
            if ($lido !== null) { $where .= ' AND c.lido=?'; $params[] = (int)$lido; }
            $stmt = $db->prepare("SELECT c.*, v.titulo AS vaga_titulo FROM curriculos c LEFT JOIN vagas v ON c.vaga_id=v.id $where ORDER BY c.created_at DESC");
            $stmt->execute($params);
            json(true, ['curriculos' => $stmt->fetchAll()]);
            break;

        // Download do currículo SÓ para quem está logado e tem permissão (os arquivos
        // têm dados pessoais — não ficam mais abertos por link direto).
        case 'baixar_curriculo':
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $db->prepare("SELECT arquivo, nome FROM curriculos WHERE id=?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            $arq = $row ? basename((string)$row['arquivo']) : '';
            $caminho = UPLOAD_DIR . $arq;
            if (!$row || $arq === '' || !is_file($caminho)) { http_response_code(404); header('Content-Type: text/plain; charset=utf-8'); echo 'Arquivo não encontrado.'; exit; }
            $ext   = strtolower(pathinfo($arq, PATHINFO_EXTENSION));
            $tipos = ['pdf' => 'application/pdf', 'doc' => 'application/msword', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            $nomeSeguro = preg_replace('/[^A-Za-z0-9_-]+/', '_', (string)$row['nome']) ?: 'curriculo';
            header('Content-Type: ' . ($tipos[$ext] ?? 'application/octet-stream'));
            header('Content-Disposition: attachment; filename="curriculo_' . $nomeSeguro . '.' . $ext . '"');
            header('Content-Length: ' . filesize($caminho));
            header('X-Content-Type-Options: nosniff');
            readfile($caminho);
            exit;

        case 'marcar_lido':
            $id = (int)($_POST['id'] ?? 0);
            $db->prepare("UPDATE curriculos SET lido=1 WHERE id=?")->execute([$id]);
            json(true, [], 'Marcado como lido.');
            break;

        case 'excluir_curriculo':
            $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
            $stmt = $db->prepare("SELECT arquivo FROM curriculos WHERE id=?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if ($row && $row['arquivo'] && file_exists(UPLOAD_DIR . $row['arquivo'])) {
                unlink(UPLOAD_DIR . $row['arquivo']);
            }
            $db->prepare("DELETE FROM curriculos WHERE id=?")->execute([$id]);
            json(true, [], 'Currículo excluído.');
            break;

        default: json(false, [], 'Ação inválida.');
    }
} catch (Throwable $e) {
    error_log('[IBR Vagas] ' . $e->getMessage());
    json(false, [], 'Erro no servidor. Tente novamente.');   // detalhes ficam só no log, não vão para o navegador
}