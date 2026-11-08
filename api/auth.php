<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'config.php';

$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $body['action'] ?? $_POST['action'] ?? $_GET['action'] ?? '';

try {
    $db = getDB();

    // ── Login ────────────────────────────────────────────────
    if ($action === 'login') {
        $email = trim($body['email'] ?? $_POST['email'] ?? '');
        $senha = $body['senha'] ?? $_POST['senha'] ?? '';

        if (!$email || !$senha) json(false, [], 'Preencha e-mail e senha.');

        // ── Limite de tentativas (contra adivinhação de senha) ──
        // Até 5 erros por IP + e-mail a cada 15 minutos; depois disso bloqueia por um tempo.
        $chave   = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '?') . '|' . strtolower($email));
        $arqTent = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ibr_login_' . $chave . '.json';
        $janela  = 15 * 60;
        $tent    = [];
        if (is_file($arqTent)) {
            $lido = json_decode((string)@file_get_contents($arqTent), true);
            if (is_array($lido)) $tent = array_values(array_filter($lido, fn($t) => is_int($t) && $t > time() - $janela));
        }
        if (count($tent) >= 5) {
            $falta = max(1, (int)ceil(($tent[0] + $janela - time()) / 60));
            http_response_code(429);
            json(false, [], "Muitas tentativas. Tente novamente em {$falta} minuto(s).");
        }

        $stmt = $db->prepare("SELECT id, nome, email, senha, nivel, permissoes FROM usuarios WHERE email = ? AND ativo = 1 LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($senha, $user['senha'])) {
            $tent[] = time();
            @file_put_contents($arqTent, json_encode($tent), LOCK_EX);
            json(false, [], 'E-mail ou senha inválidos.');
        }
        @unlink($arqTent); // acertou: zera o contador

        startSession();
        session_regenerate_id(true);
        $_SESSION['usuario_id']         = $user['id'];
        $_SESSION['usuario_nome']       = $user['nome'];
        $_SESSION['usuario_nivel']      = $user['nivel'];
        $_SESSION['usuario_permissoes'] = json_decode($user['permissoes'] ?? '[]', true) ?: [];

        json(true, currentUser(), 'Login realizado com sucesso.');
    }

    // ── Verifica sessão ativa (usado pelo dashboard) ────────────
    if ($action === 'check' || $action === 'verificar') {
        startSession();
        if (!isLoggedIn()) json(false, [], 'Não autenticado.');
        $dados = currentUser();
        // Avisa o painel se esta conta ainda usa a senha padrão de instalação ("password").
        try {
            $st = $db->prepare("SELECT senha FROM usuarios WHERE id = ? LIMIT 1");
            $st->execute([$_SESSION['usuario_id']]);
            $hash = $st->fetchColumn();
            $dados['senha_padrao'] = $hash ? password_verify('password', $hash) : false;
        } catch (Throwable $e) { $dados['senha_padrao'] = false; }
        json(true, $dados);
    }

    // ── Logout ───────────────────────────────────────────────
    if ($action === 'logout') {
        startSession();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
        json(true, [], 'Sessão encerrada.');
    }

    json(false, [], 'Ação inválida.');
} catch (Throwable $e) {
    error_log('[IBR Auth] ' . $e->getMessage());
    json(false, [], 'Erro no servidor.');
}
