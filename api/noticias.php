<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

// O dashboard manda 'action' no corpo do POST (FormData), não na query string
// — sem o fallback pro $_POST, salvar/editar/excluir/toggle caía sempre no
// 'latest' default (que responde success:true com a lista pública), fazendo
// a tela fechar como se tivesse salvo mesmo sem gravar nada no banco.
$action = $_GET['action'] ?? $_POST['action'] ?? 'latest';

try {
    $db = getDB();

    if (in_array($action, ['latest', 'lista_publica'])) {
        $limit = min((int)($_GET['limit'] ?? 3), 100);
        $stmt = $db->prepare("SELECT id,titulo,slug,resumo,imagem,categoria,data_publicacao FROM noticias WHERE ativo=1 AND data_publicacao<=NOW() ORDER BY data_publicacao DESC LIMIT :l");
        $stmt->bindValue(':l', $limit, PDO::PARAM_INT);
        $stmt->execute();
        json(true, ['noticias' => $stmt->fetchAll()]);
    }

    if ($action === 'get_publica') {
        $slug = trim($_GET['slug'] ?? '');
        if (!$slug) json(false, [], 'Slug não informado.');
        $stmt = $db->prepare("SELECT id,titulo,slug,resumo,conteudo,imagem,categoria,autor,data_publicacao FROM noticias WHERE slug=? AND ativo=1 AND data_publicacao<=NOW() LIMIT 1");
        $stmt->execute([$slug]);
        $n = $stmt->fetch();
        if (!$n) json(false, [], 'Notícia não encontrada.');
        json(true, ['noticia' => $n]);
    }

    startSession();
    if (!isLoggedIn()) json(false, [], 'Não autorizado.');
    requirePermission('noticias');

    switch ($action) {
        case 'lista':
            $rows = $db->query("SELECT * FROM noticias ORDER BY created_at DESC")->fetchAll();
            json(true, ['noticias' => $rows]);
            break;

        case 'get':
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $db->prepare("SELECT * FROM noticias WHERE id=?");
            $stmt->execute([$id]);
            $n = $stmt->fetch();
            if (!$n) json(false, [], 'Não encontrada.');
            json(true, ['noticia' => $n]);
            break;

        case 'salvar':
            $id       = (int)($_POST['id'] ?? 0);
            $titulo   = trim($_POST['titulo'] ?? '');
            $resumo   = trim($_POST['resumo'] ?? '');
            $conteudo = trim($_POST['conteudo'] ?? '');
            $cat      = trim($_POST['categoria'] ?? 'Notícias');
            $ativo    = (int)($_POST['ativo'] ?? 1);
            $destaque = (int)($_POST['destaque'] ?? 0);
            $data     = trim($_POST['data_publicacao'] ?? date('Y-m-d H:i:s'));
            if (!$titulo) json(false, [], 'Título obrigatório.');

            $novaImagem = handleImageUpload('imagem_arquivo', 'noticias');
            $imagem = $novaImagem ?? trim($_POST['imagem_atual'] ?? '');

            if ($id > 0) {
                // Mantém o slug existente ao editar — trocar a URL a cada save
                // quebrava links já publicados/compartilhados dessa notícia.
                $db->prepare("UPDATE noticias SET titulo=?,resumo=?,conteudo=?,imagem=?,categoria=?,ativo=?,destaque=?,data_publicacao=?,updated_at=NOW() WHERE id=?")
                   ->execute([$titulo,$resumo,$conteudo,$imagem,$cat,$ativo,$destaque,$data,$id]);
                json(true, [], 'Notícia atualizada.');
            } else {
                $slug = slugify($titulo) . '-' . time();
                $db->prepare("INSERT INTO noticias(titulo,slug,resumo,conteudo,imagem,categoria,ativo,destaque,data_publicacao) VALUES(?,?,?,?,?,?,?,?,?)")
                   ->execute([$titulo,$slug,$resumo,$conteudo,$imagem,$cat,$ativo,$destaque,$data]);
                json(true, ['id' => $db->lastInsertId()], 'Notícia criada.');
            }
            break;

        case 'excluir':
            $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
            $db->prepare("DELETE FROM noticias WHERE id=?")->execute([$id]);
            json(true, [], 'Excluída.');
            break;

        case 'toggle':
            $id = (int)($_POST['id'] ?? 0);
            $db->prepare("UPDATE noticias SET ativo = NOT ativo WHERE id=?")->execute([$id]);
            json(true, [], 'Status alterado.');
            break;

        default: json(false, [], 'Ação inválida.');
    }
} catch (Throwable $e) {
    error_log('[IBR Noticias] ' . $e->getMessage());
    error_log('[IBR] ' . $e->getMessage()); json(false, [], 'Erro no servidor. Tente novamente.');
}