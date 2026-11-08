<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'lista_publica';

try {
    $db = getDB();

    // ── Público ──────────────────────────────────────────
    if ($action === 'lista_publica') {
        $esp = trim($_GET['especialidade'] ?? '');
        $q   = trim($_GET['q'] ?? '');
        $sql = "SELECT id,nome,especialidade,sub_especialidade,titulo,foto,crm FROM medicos WHERE ativo=1";
        $params = [];
        if ($esp) { $sql .= " AND especialidade = ?"; $params[] = $esp; }
        if ($q)   { $sql .= " AND (nome LIKE ? OR especialidade LIKE ?)"; $params[] = "%$q%"; $params[] = "%$q%"; }
        $sql .= " ORDER BY especialidade, nome";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        json(true, ['medicos' => $stmt->fetchAll()]);
    }

    if ($action === 'especialidades') {
        $rows = $db->query("SELECT DISTINCT especialidade FROM medicos WHERE ativo=1 ORDER BY especialidade")->fetchAll(PDO::FETCH_COLUMN);
        json(true, ['especialidades' => $rows]);
    }

    // ── Protegido ─────────────────────────────────────────
    startSession();
    if (!isLoggedIn()) json(false, [], 'Não autorizado.');
    requirePermission('medicos');

    switch ($action) {
        case 'lista':
            $rows = $db->query("SELECT * FROM medicos ORDER BY especialidade, nome")->fetchAll();
            json(true, ['medicos' => $rows]);
            break;

        case 'get':
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $db->prepare("SELECT * FROM medicos WHERE id=?");
            $stmt->execute([$id]);
            $m = $stmt->fetch();
            if (!$m) json(false, [], 'Não encontrado.');
            json(true, ['medico' => $m]);
            break;

        case 'salvar':
            $id       = (int)($_POST['id'] ?? 0);
            $nome     = trim($_POST['nome'] ?? '');
            $esp      = trim($_POST['especialidade'] ?? '');
            $sub      = trim($_POST['sub_especialidade'] ?? '');
            $titulo   = trim($_POST['titulo'] ?? 'Dr.');
            $crm      = trim($_POST['crm'] ?? '');
            $bio      = trim($_POST['bio'] ?? '');
            $ativo    = (int)($_POST['ativo'] ?? 1);
            $ordem    = (int)($_POST['ordem'] ?? 0);

            if (!$nome || !$esp) json(false, [], 'Nome e especialidade obrigatórios.');

            $novaFoto = handleImageUpload('foto_arquivo', 'medicos');
            $foto = $novaFoto ?? trim($_POST['foto_atual'] ?? '');

            if ($id > 0) {
                $db->prepare("UPDATE medicos SET nome=?,especialidade=?,sub_especialidade=?,titulo=?,crm=?,foto=?,bio=?,ativo=?,ordem=?,updated_at=NOW() WHERE id=?")
                   ->execute([$nome,$esp,$sub,$titulo,$crm,$foto,$bio,$ativo,$ordem,$id]);
                json(true, [], 'Médico atualizado.');
            } else {
                $db->prepare("INSERT INTO medicos(nome,especialidade,sub_especialidade,titulo,crm,foto,bio,ativo,ordem) VALUES(?,?,?,?,?,?,?,?,?)")
                   ->execute([$nome,$esp,$sub,$titulo,$crm,$foto,$bio,$ativo,$ordem]);
                json(true, ['id' => $db->lastInsertId()], 'Médico cadastrado.');
            }
            break;

        case 'excluir':
            $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
            $db->prepare("DELETE FROM medicos WHERE id=?")->execute([$id]);
            json(true, [], 'Médico excluído.');
            break;

        case 'toggle':
            $id = (int)($_POST['id'] ?? 0);
            $db->prepare("UPDATE medicos SET ativo = NOT ativo WHERE id=?")->execute([$id]);
            json(true, [], 'Status alterado.');
            break;

        default: json(false, [], 'Ação inválida.');
    }
} catch (Throwable $e) {
    error_log('[IBR Medicos] ' . $e->getMessage());
    error_log('[IBR] ' . $e->getMessage()); json(false, [], 'Erro no servidor. Tente novamente.');
}