<?php
// ============================================================
// IBR Hospital — Fale Conosco / api/contato.php
// ============================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Responde preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Só aceita POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit;
}

require_once __DIR__ . '/config.php';
limitarEnvios('contato');
$db = getDB();

// ── Cria a tabela automaticamente se não existir — compartilhada
//    com api/ouvidoria.php, que também grava nela ──
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

$nome     = clean($data['nome']     ?? '') ?: 'Não informado';
$telefone = clean($data['telefone'] ?? '') ?: 'Não informado';
$assunto  = clean($data['assunto']  ?? '');
$mensagem = clean($data['mensagem'] ?? '');

// ── Validação obrigatória ─────────────────────────────────────
if (empty($assunto)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Assunto é obrigatório.']);
    exit;
}

if (empty($mensagem)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Mensagem é obrigatória.']);
    exit;
}

// ── Salva no banco — fonte de verdade. O e-mail abaixo é só um
//    aviso extra e não pode fazer a mensagem se perder caso o
//    servidor não tenha SMTP configurado (comum em dev local). ──
$db->prepare("INSERT INTO mensagens(origem,tipo,nome,telefone,mensagem) VALUES('contato',?,?,?,?)")
   ->execute([$assunto, $nome, $telefone, $mensagem]);

// ── Configurações de email ────────────────────────────────────
$destinatario = 'ibr@ibr.com.br';
$assuntoEmail = '[Fale Conosco IBR] ' . $assunto . ' — ' . $nome;

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
      <div class="badge">Fale Conosco</div>
      <h1>Nova Mensagem Recebida</h1>
      <p>IBR Hospital — Site Institucional</p>
    </div>
    <div class="body">
      <table>
        <tr><td class="label">Nome</td><td class="value">' . $nome . '</td></tr>
        <tr><td class="label">Telefone</td><td class="value">' . $telefone . '</td></tr>
        <tr><td class="label">Assunto</td><td class="value"><strong>' . $assunto . '</strong></td></tr>
        <tr><td class="label">Data/Hora</td><td class="value">' . date('d/m/Y H:i:s') . '</td></tr>
      </table>
      <div class="desc-title">Mensagem</div>
      <div class="desc-box">' . nl2br($mensagem) . '</div>
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
$headers .= 'From: Site IBR <noreply@ibr.com.br>' . "\r\n";
$headers .= 'X-Mailer: PHP/' . phpversion();

// ── Envio (melhor esforço — não decide o sucesso da resposta,
//    já que a mensagem já está salva no banco) ─────────────────
@mail($destinatario, '=?UTF-8?B?' . base64_encode($assuntoEmail) . '?=', $corpo, $headers);

// ── Resposta ──────────────────────────────────────────────────
http_response_code(200);
echo json_encode(['success' => true, 'message' => 'Mensagem enviada com sucesso.']);
