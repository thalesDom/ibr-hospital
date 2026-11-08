<?php
// ============================================================
// IBR Hospital — Ouvidoria / api/ouvidoria.php
// Recebe manifestações do formulário público de Ouvidoria e
// também serve o painel administrativo (Contato + Ouvidoria).
// ============================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';
$db = getDB();

// ── Cria a tabela automaticamente se não existir — recebe tanto
//    as mensagens do Fale Conosco quanto as da Ouvidoria ──
$db->exec("CREATE TABLE IF NOT EXISTS mensagens (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    origem     ENUM('contato','ouvidoria') NOT NULL,
    tipo       VARCHAR(120) DEFAULT NULL,
    nome       VARCHAR(200) DEFAULT NULL,
    email      VARCHAR(255) DEFAULT NULL,
    telefone   VARCHAR(30)  DEFAULT NULL,
    setor      VARCHAR(120) DEFAULT NULL,
    mensagem   TEXT NOT NULL,
    lido       TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$action = $_GET['action'] ?? null;

// ── Painel administrativo (Contato + Ouvidoria) ─────────────
if (in_array($action, ['lista', 'marcar_lido', 'excluir'], true)) {
    startSession();
    if (!isLoggedIn()) json(false, [], 'Não autorizado.');

    // Esse arquivo serve duas telas do painel (Contato e Ouvidoria),
    // cada uma com sua própria permissão — "contato" só vê/mexe em
    // mensagens origem=contato, "ouvidoria" só nas origem=ouvidoria.
    if ($action === 'lista') {
        $origem = $_GET['origem'] ?? '';
        if ($origem !== '') requirePermission($origem === 'contato' ? 'contato' : 'ouvidoria');
        $lido   = $_GET['lido'] ?? null;
        $where  = 'WHERE 1=1';
        $params = [];
        if ($origem !== '')            { $where .= ' AND origem=?'; $params[] = $origem; }
        if ($lido !== null && $lido !== '') { $where .= ' AND lido=?'; $params[] = (int)$lido; }
        $stmt = $db->prepare("SELECT * FROM mensagens $where ORDER BY created_at DESC");
        $stmt->execute($params);
        json(true, ['mensagens' => $stmt->fetchAll()]);
    }

    if ($action === 'marcar_lido' || $action === 'excluir') {
        $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
        $stmt = $db->prepare("SELECT origem FROM mensagens WHERE id=?");
        $stmt->execute([$id]);
        $origem = $stmt->fetchColumn();
        if ($origem) requirePermission($origem === 'contato' ? 'contato' : 'ouvidoria');

        if ($action === 'marcar_lido') {
            $db->prepare("UPDATE mensagens SET lido=1 WHERE id=?")->execute([$id]);
            json(true, [], 'Marcada como lida.');
        } else {
            $db->prepare("DELETE FROM mensagens WHERE id=?")->execute([$id]);
            json(true, [], 'Excluída.');
        }
    }
}

// ── Público: envio do formulário de Ouvidoria ───────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    json(false, [], 'Método não permitido.');
}
limitarEnvios('ouvidoria');

// ── Recebe JSON ou form-data ──────────────────────────────────
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    $data = $_POST;
}

// ── Sanitiza campos ───────────────────────────────────────────
function clean($val) {
    return htmlspecialchars(strip_tags(trim($val ?? '')), ENT_QUOTES, 'UTF-8');
}

$tipo      = clean($data['tipo']      ?? '');
$nome      = clean($data['nome']      ?? '') ?: 'Anônimo';
$email     = filter_var(trim($data['email'] ?? ''), FILTER_SANITIZE_EMAIL) ?: 'Não informado';
$telefone  = clean($data['telefone']  ?? '') ?: 'Não informado';
$setor     = clean($data['setor']     ?? '') ?: 'Não informado';
$descricao = clean($data['descricao'] ?? '');

// ── Validação obrigatória ─────────────────────────────────────
if (empty($tipo)) {
    http_response_code(422);
    json(false, [], 'Tipo de manifestação é obrigatório.');
}

if (empty($descricao)) {
    http_response_code(422);
    json(false, [], 'Descrição é obrigatória.');
}

// ── Salva no banco — fonte de verdade. O e-mail abaixo é só um
//    aviso extra e não pode fazer a manifestação se perder caso
//    o servidor não tenha SMTP configurado (comum em dev local). ──
$db->prepare("INSERT INTO mensagens(origem,tipo,nome,email,telefone,setor,mensagem) VALUES('ouvidoria',?,?,?,?,?,?)")
   ->execute([$tipo, $nome, $email, $telefone, $setor, $descricao]);

// ── Configurações de email ────────────────────────────────────
$destinatario = 'ti@ibr.com.br';
$assunto      = '[Ouvidoria IBR] ' . $tipo . ' — ' . $nome;

// ── Monta corpo do email (HTML) ───────────────────────────────
$corpo = '
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: "Plus Jakarta Sans", Arial, sans-serif; background: #f4f7fc; margin: 0; padding: 0; }
    .wrap { max-width: 620px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(13,32,68,.1); }
    .header { background: linear-gradient(135deg, #060f1e, #0d2550); padding: 36px 40px; }
    .header h1 { color: #fff; font-size: 22px; margin: 0 0 4px; font-weight: 800; }
    .header p  { color: rgba(255,255,255,.55); font-size: 13px; margin: 0; }
    .badge { display: inline-block; background: rgba(90,158,240,.18); color: #5a9ef0; border: 1px solid rgba(90,158,240,.3); padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 14px; }
    .body  { padding: 36px 40px; }
    .row   { display: flex; gap: 0; margin-bottom: 0; }
    table  { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    td     { padding: 12px 14px; font-size: 14px; border-bottom: 1px solid #edf0f7; vertical-align: top; }
    td.label { width: 38%; font-weight: 700; color: #0d1f3c; background: #f8faff; }
    td.value { color: #3d5175; }
    .desc-box { background: #f8faff; border-left: 4px solid #1a5ccc; border-radius: 0 10px 10px 0; padding: 20px; font-size: 14px; color: #3d5175; line-height: 1.75; white-space: pre-wrap; }
    .desc-title { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #1a5ccc; margin-bottom: 12px; }
    .footer { background: #060f1e; padding: 20px 40px; text-align: center; }
    .footer p { color: rgba(255,255,255,.3); font-size: 11px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="badge">Ouvidoria</div>
      <h1>Nova Manifestação Recebida</h1>
      <p>IBR Hospital — Canal Seguro &amp; Confidencial</p>
    </div>
    <div class="body">
      <table>
        <tr><td class="label">Tipo</td><td class="value"><strong>' . $tipo . '</strong></td></tr>
        <tr><td class="label">Nome</td><td class="value">' . $nome . '</td></tr>
        <tr><td class="label">E-mail</td><td class="value">' . $email . '</td></tr>
        <tr><td class="label">Telefone</td><td class="value">' . $telefone . '</td></tr>
        <tr><td class="label">Setor / Área</td><td class="value">' . $setor . '</td></tr>
        <tr><td class="label">Data/Hora</td><td class="value">' . date('d/m/Y H:i:s') . '</td></tr>
      </table>
      <div class="desc-title">Descrição</div>
      <div class="desc-box">' . nl2br($descricao) . '</div>
    </div>
    <div class="footer">
      <p>IBR Instituto Brandão de Reabilitação — CNPJ 13.284.872/0001-70</p>
    </div>
  </div>
</body>
</html>';

// ── Headers do email ──────────────────────────────────────────
$headers  = 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";
$headers .= 'From: Ouvidoria IBR <noreply@ibr.com.br>' . "\r\n";
$headers .= 'Reply-To: ' . $email . "\r\n";
$headers .= 'X-Mailer: PHP/' . phpversion();

// ── Envio (melhor esforço — não é isso que decide o sucesso da
//    resposta, já que a manifestação já está salva no banco) ──
@mail($destinatario, '=?UTF-8?B?' . base64_encode($assunto) . '?=', $corpo, $headers);

json(true, [], 'Manifestação enviada com sucesso.');
