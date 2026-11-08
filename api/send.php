<?php
// ============================================================
// IBR Hospital — Ouvidoria / send.php
// Coloque este arquivo em: api/ouvidoria.php
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
    echo json_encode(['success' => false, 'message' => 'Tipo de manifestação é obrigatório.']);
    exit;
}

if (empty($descricao)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Descrição é obrigatória.']);
    exit;
}

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

// ── Envio ─────────────────────────────────────────────────────

/*
 * OPÇÃO A — mail() nativo (padrão, funciona na maioria dos servidores compartilhados)
 */
$enviado = mail($destinatario, '=?UTF-8?B?' . base64_encode($assunto) . '?=', $corpo, $headers);

/*
 * OPÇÃO B — PHPMailer via SMTP (descomente se usar PHPMailer)
 * Instale com: composer require phpmailer/phpmailer
 *
 * require_once __DIR__ . '/../vendor/autoload.php';
 * use PHPMailer\PHPMailer\PHPMailer;
 *
 * $mail = new PHPMailer(true);
 * try {
 *     $mail->isSMTP();
 *     $mail->Host       = 'smtp.seuprovedor.com.br';
 *     $mail->SMTPAuth   = true;
 *     $mail->Username   = 'ti@ibr.com.br';
 *     $mail->Password   = 'SUA_SENHA';
 *     $mail->SMTPSecure = 'tls';
 *     $mail->Port       = 587;
 *     $mail->CharSet    = 'UTF-8';
 *     $mail->setFrom('noreply@ibr.com.br', 'Ouvidoria IBR');
 *     $mail->addAddress('ti@ibr.com.br', 'TI IBR');
 *     $mail->addReplyTo($email, $nome);
 *     $mail->isHTML(true);
 *     $mail->Subject = $assunto;
 *     $mail->Body    = $corpo;
 *     $mail->send();
 *     $enviado = true;
 * } catch (Exception $e) {
 *     $enviado = false;
 * }
 */

// ── Resposta ──────────────────────────────────────────────────
if ($enviado) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Manifestação enviada com sucesso.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Falha ao enviar. Tente novamente.']);
}