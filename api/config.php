<?php
// ── Configurações do banco ──────────────────────────────
define('DB_HOST', 'localhost');
define('DB_PORT', getenv('IBR_DB_PORT') ?: '3306');
define('DB_NAME', 'ibr_hospital');
define('DB_USER', 'root');       // ← altere
define('DB_PASS', '');           // ← altere
define('DB_CHARSET', 'utf8mb4');

// ── Configurações da aplicação ──────────────────────────
define('APP_NAME', 'IBR Hospital');
define('SESSION_NAME', 'ibr_admin');
define('UPLOAD_DIR', __DIR__ . '/../uploads/curriculos/');
define('UPLOAD_URL', '../uploads/curriculos/');

// ── Telas do painel controláveis por permissão ──────────
// "usuarios" não entra aqui de propósito — só admin mexe em usuário,
// nunca é uma permissão que dá pra conceder a um editor.
define('PAINEL_PAGINAS', ['slides','noticias','medicos','servicos','especialidades','contato','ouvidoria','vagas','curriculos']);

// ── Conexão PDO ─────────────────────────────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $dsn = "mysql:host=".DB_HOST.";port=".DB_PORT.";dbname=".DB_NAME.";charset=".DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    // usuarios já existe desde o schema.sql original, sem a coluna de
    // permissões por tela — adiciona uma vez por processo (idempotente).
    // MySQL não aceita "ADD COLUMN IF NOT EXISTS" (isso é só MariaDB),
    // então confere no information_schema antes de alterar.
    $temColuna = $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='usuarios' AND column_name='permissoes'")->fetchColumn();
    if (!$temColuna) {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN permissoes TEXT DEFAULT NULL");
    }
    return $pdo;
}

// ── JSON response ───────────────────────────────────────
function json(bool $ok, array $data = [], string $msg = ''): void {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['success' => $ok, 'message' => $msg], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

// ── Limite de envios nos formulários públicos (anti-spam) ──
// Permite até $max envios por IP a cada $janela segundos para cada tipo de
// formulário ($nome). Passou disso, responde 429. Generoso de propósito: vários
// visitantes atrás do mesmo Wi-Fi/IP não devem ser bloqueados sem motivo.
function limitarEnvios(string $nome, int $max = 10, int $janela = 600): void {
    $arq   = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ibr_rl_' . $nome . '_' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '?') . '.json';
    $agora = time();
    $lista = [];
    if (is_file($arq)) {
        $lido = json_decode((string)@file_get_contents($arq), true);
        if (is_array($lido)) $lista = array_values(array_filter($lido, fn($t) => is_int($t) && $t > $agora - $janela));
    }
    if (count($lista) >= $max) {
        http_response_code(429);
        json(false, [], 'Muitos envios em pouco tempo. Aguarde alguns minutos e tente novamente.');
    }
    $lista[] = $agora;
    @file_put_contents($arq, json_encode($lista), LOCK_EX);
}

// ── Session helpers ─────────────────────────────────────
function startSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_name(SESSION_NAME);
        // Cookie da sessão: não legível por JavaScript (httponly), não enviado em
        // requisições vindas de outros sites (SameSite) e só por HTTPS quando o site usa HTTPS.
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
              || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => $https,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function isLoggedIn(): bool {
    startSession();
    return !empty($_SESSION['usuario_id']);
}

function requireLogin(): void {
    if (!isLoggedIn()) {
        // Chamado a partir de api/*.php — login.html vive em area-restrita/,
        // um nível acima de api/.
        header('Location: ../area-restrita/login.html');
        exit;
    }
}

function currentUser(): array {
    startSession();
    return [
        'id'         => $_SESSION['usuario_id'] ?? 0,
        'nome'       => $_SESSION['usuario_nome'] ?? '',
        'nivel'      => $_SESSION['usuario_nivel'] ?? 'editor',
        // admin sempre enxerga tudo — a lista de permissões só importa pro editor.
        'permissoes' => ($_SESSION['usuario_nivel'] ?? '') === 'admin' ? PAINEL_PAGINAS : ($_SESSION['usuario_permissoes'] ?? []),
    ];
}

// ── Controle de acesso por tela ──────────────────────────
// Admin sempre passa. Editor só passa se a tela ($page, um dos
// valores de PAINEL_PAGINAS) estiver na lista de permissões dele.
// Chamar logo após isLoggedIn() em cada api/*.php protegido.
function requirePermission(string $page): void {
    startSession();
    if (($_SESSION['usuario_nivel'] ?? '') === 'admin') return;
    $permissoes = $_SESSION['usuario_permissoes'] ?? [];
    if (!in_array($page, $permissoes, true)) {
        json(false, [], 'Você não tem permissão para acessar esta área.');
    }
}

// ── Upload de imagem (notícias, médicos, serviços, especialidades) ──
// Devolve a URL pública (raiz do site, funciona de qualquer profundidade
// de página) do arquivo salvo, ou null se nenhum arquivo novo foi
// enviado nesse campo — nesse caso quem chamou deve manter a imagem
// já existente (o form manda ela num campo "*_atual" à parte).
function handleImageUpload(string $field, string $subdir): ?string {
    if (empty($_FILES[$field]['name'])) return null;

    $file = $_FILES[$field];
    if ($file['error'] !== UPLOAD_ERR_OK) json(false, [], 'Erro ao enviar imagem.');

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
        json(false, [], 'Formato de imagem inválido. Use JPG, PNG, WEBP ou GIF.');
    }
    if ($file['size'] > 5 * 1024 * 1024) json(false, [], 'Imagem muito grande (máx 5MB).');

    $dir = __DIR__ . '/../uploads/' . $subdir . '/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $filename = uniqid('img_') . '.' . $ext;
    move_uploaded_file($file['tmp_name'], $dir . $filename);

    return '/uploads/' . $subdir . '/' . $filename;
}

// ── Slug generator ──────────────────────────────────────
function slugify(string $text): string {
    $text = mb_strtolower($text, 'UTF-8');
    $text = str_replace(['á','à','ã','â','ä'], 'a', $text);
    $text = str_replace(['é','è','ê','ë'], 'e', $text);
    $text = str_replace(['í','ì','î','ï'], 'i', $text);
    $text = str_replace(['ó','ò','õ','ô','ö'], 'o', $text);
    $text = str_replace(['ú','ù','û','ü'], 'u', $text);
    $text = str_replace(['ç'], 'c', $text);
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/[\s-]+/', '-', trim($text));
    return $text;
}