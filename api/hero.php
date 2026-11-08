<?php
// ============================================================
// IBR Hospital — api/hero.php
// Slides do carrossel da home. Sem action + GET = público (usado
// pelo home/script.js pra montar o hero); as demais actions são
// do painel administrativo (menu "Slide", dentro de Conteúdo).
// ============================================================

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    $db = getDB();

    // ── Cria a tabela automaticamente se não existir ──
    $db->exec("CREATE TABLE IF NOT EXISTS hero_slides (
        id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
        eyebrow    VARCHAR(120) DEFAULT NULL,
        titulo     VARCHAR(220) NOT NULL,
        destaque   VARCHAR(120) DEFAULT NULL,
        descricao  TEXT DEFAULT NULL,
        imagem     VARCHAR(500) NOT NULL,
        imagem_pos ENUM('center','top','bottom','left','right') NOT NULL DEFAULT 'center',
        ordem      TINYINT NOT NULL DEFAULT 1,
        ativo      TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // ── Semeia com os 3 slides que já existiam fixos no HTML —
    //    só na primeira vez (tabela vazia), pra abrir o painel já
    //    com o que está no ar hoje, em vez de uma lista em branco. ──
    $total = (int)$db->query("SELECT COUNT(*) FROM hero_slides")->fetchColumn();
    if ($total === 0) {
        $seed = $db->prepare("INSERT INTO hero_slides(eyebrow,titulo,destaque,descricao,imagem,imagem_pos,ordem,ativo) VALUES(?,?,?,?,?,?,?,1)");
        $seed->execute(['Desde 1986', 'IBR Hospital, Um Marco na Saúde Conquistense', 'Um Marco na Saúde', 'Há mais de 35 anos sendo referência em saúde em Vitória da Conquista, oferecendo atendimento humanizado e tecnologia de ponta.', '/imagens/IBRHospital.jpg', 'center', 1]);
        $seed->execute(['Urgência & Emergência', 'Atendimento 24 Horas, Pronto-Socorro Sempre Disponível', '24 Horas', 'Equipe médica especializada pronta para atender emergências a qualquer hora do dia ou da noite, com toda estrutura necessária.', '/imagens/pronto-socorroo.jpeg', 'left', 2]);
        $seed->execute(['Centro Cirúrgico Moderno', 'Tecnologia de Ponta em Cirurgias', 'Ponta', 'Equipamentos de última geração e equipe altamente qualificada para realizar procedimentos cirúrgicos com máxima segurança e precisão.', '/imagens/medicos.jpg', 'top', 3]);
    }

    // ── Público: slides ativos pro carrossel da home ──
    if ($action === '' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $rows = $db->query("SELECT * FROM hero_slides WHERE ativo=1 ORDER BY ordem ASC, id ASC")->fetchAll();
        json(true, ['slides' => $rows]);
    }

    // ── Painel administrativo ──
    startSession();
    if (!isLoggedIn()) json(false, [], 'Não autorizado.');
    requirePermission('slides');

    switch ($action) {
        case 'lista':
            $rows = $db->query("SELECT * FROM hero_slides ORDER BY ordem ASC, id ASC")->fetchAll();
            json(true, ['slides' => $rows]);
            break;

        case 'get':
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $db->prepare("SELECT * FROM hero_slides WHERE id=?");
            $stmt->execute([$id]);
            $s = $stmt->fetch();
            if (!$s) json(false, [], 'Não encontrado.');
            json(true, ['slide' => $s]);
            break;

        case 'salvar':
            $id        = (int)($_POST['id'] ?? 0);
            $eyebrow   = trim($_POST['eyebrow'] ?? '');
            $titulo    = trim($_POST['titulo'] ?? '');
            $destaque  = trim($_POST['destaque'] ?? '');
            $descricao = trim($_POST['descricao'] ?? '');
            $pos       = in_array($_POST['imagem_pos'] ?? '', ['center','top','bottom','left','right']) ? $_POST['imagem_pos'] : 'center';
            $ordem     = (int)($_POST['ordem'] ?? 1);
            $ativo     = (int)($_POST['ativo'] ?? 1);

            if (!$titulo) json(false, [], 'Título obrigatório.');

            $novaImagem = handleImageUpload('imagem_arquivo', 'slides');
            $imagem = $novaImagem ?? trim($_POST['imagem_atual'] ?? '');
            if (!$imagem) json(false, [], 'Selecione uma imagem.');

            if ($id > 0) {
                $db->prepare("UPDATE hero_slides SET eyebrow=?,titulo=?,destaque=?,descricao=?,imagem=?,imagem_pos=?,ordem=?,ativo=?,updated_at=NOW() WHERE id=?")
                   ->execute([$eyebrow, $titulo, $destaque, $descricao, $imagem, $pos, $ordem, $ativo, $id]);
                json(true, [], 'Slide atualizado.');
            } else {
                $db->prepare("INSERT INTO hero_slides(eyebrow,titulo,destaque,descricao,imagem,imagem_pos,ordem,ativo) VALUES(?,?,?,?,?,?,?,?)")
                   ->execute([$eyebrow, $titulo, $destaque, $descricao, $imagem, $pos, $ordem, $ativo]);
                json(true, ['id' => $db->lastInsertId()], 'Slide criado.');
            }
            break;

        case 'toggle':
            $id = (int)($_POST['id'] ?? 0);
            $db->prepare("UPDATE hero_slides SET ativo = NOT ativo WHERE id=?")->execute([$id]);
            json(true, [], 'Status alterado.');
            break;

        case 'excluir':
            $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
            $db->prepare("DELETE FROM hero_slides WHERE id=?")->execute([$id]);
            json(true, [], 'Slide excluído.');
            break;

        default: json(false, [], 'Ação inválida.');
    }
} catch (Throwable $e) {
    error_log('[IBR Hero] ' . $e->getMessage());
    error_log('[IBR] ' . $e->getMessage()); json(false, [], 'Erro no servidor. Tente novamente.');
}
