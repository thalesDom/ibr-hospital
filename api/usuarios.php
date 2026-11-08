<?php
// ============================================================
// IBR Hospital — api/usuarios.php
// Gestão de usuários do painel (menu "Usuários") — só admin
// acessa, independente de qualquer permissão de tela.
// ============================================================

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Quantos admins ativos existem além do informado — usado pra nunca
// deixar o painel sem nenhum admin capaz de entrar.
function contarOutrosAdminsAtivos(PDO $db, int $excetoId): int {
    $stmt = $db->prepare("SELECT COUNT(*) FROM usuarios WHERE nivel='admin' AND ativo=1 AND id<>?");
    $stmt->execute([$excetoId]);
    return (int)$stmt->fetchColumn();
}

try {
    $db = getDB();

    startSession();
    if (!isLoggedIn()) json(false, [], 'Não autorizado.');
    if (($_SESSION['usuario_nivel'] ?? '') !== 'admin') json(false, [], 'Apenas administradores acessam esta área.');

    $meuId = (int)$_SESSION['usuario_id'];

    switch ($action) {
        case 'lista':
            $rows = $db->query("SELECT id,nome,email,nivel,ativo,permissoes,created_at FROM usuarios ORDER BY nome")->fetchAll();
            foreach ($rows as &$r) $r['permissoes'] = json_decode($r['permissoes'] ?? '[]', true) ?: [];
            json(true, ['usuarios' => $rows, 'paginas' => PAINEL_PAGINAS]);
            break;

        case 'get':
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $db->prepare("SELECT id,nome,email,nivel,ativo,permissoes,created_at FROM usuarios WHERE id=?");
            $stmt->execute([$id]);
            $u = $stmt->fetch();
            if (!$u) json(false, [], 'Não encontrado.');
            $u['permissoes'] = json_decode($u['permissoes'] ?? '[]', true) ?: [];
            json(true, ['usuario' => $u, 'paginas' => PAINEL_PAGINAS]);
            break;

        case 'salvar':
            $id     = (int)($_POST['id'] ?? 0);
            $nome   = trim($_POST['nome'] ?? '');
            $email  = trim($_POST['email'] ?? '');
            $nivel  = in_array($_POST['nivel'] ?? '', ['admin','editor']) ? $_POST['nivel'] : 'editor';
            $ativo  = (int)($_POST['ativo'] ?? 1);
            $senha  = (string)($_POST['senha'] ?? '');
            $permissoesEnviadas = array_values(array_intersect((array)($_POST['permissoes'] ?? []), PAINEL_PAGINAS));
            $permissoes = $nivel === 'admin' ? [] : $permissoesEnviadas;

            if (!$nome || !$email) json(false, [], 'Nome e email são obrigatórios.');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json(false, [], 'Email inválido.');

            // Não deixa o admin se trancar pra fora: nem rebaixar a
            // própria conta, nem desativar a própria conta.
            if ($id === $meuId) {
                if ($nivel !== 'admin') json(false, [], 'Você não pode remover seu próprio nível de administrador.');
                if (!$ativo) json(false, [], 'Você não pode desativar sua própria conta.');
            }

            if ($id > 0) {
                // Se essa edição tira o usuário de admin ou o desativa,
                // precisa sobrar pelo menos outro admin ativo.
                $stmtAtual = $db->prepare("SELECT nivel, ativo FROM usuarios WHERE id=?");
                $stmtAtual->execute([$id]);
                $atual = $stmtAtual->fetch();
                if (!$atual) json(false, [], 'Usuário não encontrado.');

                $eraAdminAtivo    = $atual['nivel'] === 'admin' && (int)$atual['ativo'] === 1;
                $continuaAdminAtivo = $nivel === 'admin' && $ativo === 1;
                if ($eraAdminAtivo && !$continuaAdminAtivo && contarOutrosAdminsAtivos($db, $id) === 0) {
                    json(false, [], 'Precisa existir pelo menos um administrador ativo.');
                }

                if ($senha !== '') {
                    if (strlen($senha) < 6) json(false, [], 'Senha deve ter pelo menos 6 caracteres.');
                    $hash = password_hash($senha, PASSWORD_DEFAULT);
                    $stmt = $db->prepare("UPDATE usuarios SET nome=?,email=?,nivel=?,ativo=?,permissoes=?,senha=? WHERE id=?");
                    $stmt->execute([$nome, $email, $nivel, $ativo, json_encode($permissoes), $hash, $id]);
                } else {
                    $stmt = $db->prepare("UPDATE usuarios SET nome=?,email=?,nivel=?,ativo=?,permissoes=? WHERE id=?");
                    $stmt->execute([$nome, $email, $nivel, $ativo, json_encode($permissoes), $id]);
                }

                // Se o admin editou os próprios dados, a sessão precisa
                // refletir na hora (nível/permissões usados em toda checagem).
                if ($id === $meuId) {
                    $_SESSION['usuario_nome']       = $nome;
                    $_SESSION['usuario_nivel']      = $nivel;
                    $_SESSION['usuario_permissoes'] = $permissoes;
                }

                json(true, [], 'Usuário atualizado.');
            } else {
                if (strlen($senha) < 6) json(false, [], 'Senha deve ter pelo menos 6 caracteres.');
                $hash = password_hash($senha, PASSWORD_DEFAULT);
                try {
                    $stmt = $db->prepare("INSERT INTO usuarios(nome,email,senha,nivel,ativo,permissoes) VALUES(?,?,?,?,?,?)");
                    $stmt->execute([$nome, $email, $hash, $nivel, $ativo, json_encode($permissoes)]);
                } catch (PDOException $e) {
                    if ($e->getCode() === '23000') json(false, [], 'Já existe um usuário com esse email.');
                    throw $e;
                }
                json(true, ['id' => $db->lastInsertId()], 'Usuário criado.');
            }
            break;

        case 'toggle':
            $id = (int)($_POST['id'] ?? 0);
            if ($id === $meuId) json(false, [], 'Você não pode desativar sua própria conta.');

            $stmt = $db->prepare("SELECT nivel, ativo FROM usuarios WHERE id=?");
            $stmt->execute([$id]);
            $atual = $stmt->fetch();
            if (!$atual) json(false, [], 'Usuário não encontrado.');

            if ($atual['nivel'] === 'admin' && (int)$atual['ativo'] === 1 && contarOutrosAdminsAtivos($db, $id) === 0) {
                json(false, [], 'Precisa existir pelo menos um administrador ativo.');
            }

            $db->prepare("UPDATE usuarios SET ativo = NOT ativo WHERE id=?")->execute([$id]);
            json(true, [], 'Status alterado.');
            break;

        case 'excluir':
            $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
            if ($id === $meuId) json(false, [], 'Você não pode excluir sua própria conta.');

            $stmt = $db->prepare("SELECT nivel, ativo FROM usuarios WHERE id=?");
            $stmt->execute([$id]);
            $atual = $stmt->fetch();
            if (!$atual) json(false, [], 'Usuário não encontrado.');

            if ($atual['nivel'] === 'admin' && (int)$atual['ativo'] === 1 && contarOutrosAdminsAtivos($db, $id) === 0) {
                json(false, [], 'Precisa existir pelo menos um administrador ativo.');
            }

            $db->prepare("DELETE FROM usuarios WHERE id=?")->execute([$id]);
            json(true, [], 'Usuário excluído.');
            break;

        default: json(false, [], 'Ação inválida.');
    }
} catch (Throwable $e) {
    error_log('[IBR Usuarios] ' . $e->getMessage());
    error_log('[IBR] ' . $e->getMessage()); json(false, [], 'Erro no servidor. Tente novamente.');
}
