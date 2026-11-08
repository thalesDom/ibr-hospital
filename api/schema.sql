-- ═══════════════════════════════════════════════════════════
--  IBR Hospital — Schema Completo
-- ═══════════════════════════════════════════════════════════
CREATE DATABASE IF NOT EXISTS ibr_hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ibr_hospital;

-- ── Usuários ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel ENUM('admin','editor') NOT NULL DEFAULT 'editor',
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Login padrão: admin@ibr.com.br / password
INSERT INTO usuarios (nome, email, senha, nivel) VALUES
('Administrador IBR', 'admin@ibr.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- ── Notícias ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS noticias (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    resumo TEXT DEFAULT NULL,
    conteudo LONGTEXT DEFAULT NULL,
    imagem VARCHAR(512) DEFAULT NULL,
    categoria VARCHAR(100) DEFAULT 'Notícias',
    autor VARCHAR(150) DEFAULT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    destaque TINYINT(1) NOT NULL DEFAULT 0,
    data_publicacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ativo_data (ativo, data_publicacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO noticias (titulo, slug, resumo, imagem, categoria, data_publicacao) VALUES
('IBR Hospital conquista certificação ONA de Excelência', 'ibr-certificacao-ona', 'O Instituto Brandão de Reabilitação reafirma seu compromisso com a qualidade e segurança no atendimento ao paciente.', 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&q=80', 'Institucional', NOW()),
('Nova ala de diagnóstico por imagem amplia capacidade', 'nova-ala-diagnostico', 'Equipamentos de última geração em ressonância magnética e tomografia chegam ao IBR.', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80', 'Estrutura', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('Campanha de saúde cardiovascular: consultas gratuitas', 'campanha-cardiovascular', 'Durante o mês, o IBR Hospital realiza triagem cardiovascular gratuita para a população de Vitória da Conquista.', 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&q=80', 'Campanhas', DATE_SUB(NOW(), INTERVAL 7 DAY));

-- ── Vagas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vagas (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    departamento VARCHAR(150) NOT NULL,
    tipo ENUM('CLT','PJ','Estágio','Temporário') DEFAULT 'CLT',
    descricao TEXT DEFAULT NULL,
    requisitos TEXT DEFAULT NULL,
    salario VARCHAR(100) DEFAULT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO vagas (titulo, departamento, tipo, descricao, requisitos) VALUES
('Enfermeiro(a) UTI', 'Enfermagem', 'CLT', 'Atuar na Unidade de Terapia Intensiva com pacientes críticos.', 'COREN ativo, experiência mínima de 2 anos em UTI.'),
('Técnico(a) de Radiologia', 'Diagnóstico por Imagem', 'CLT', 'Operar equipamentos de raio-X, tomografia e ressonância.', 'Registro no CRT, experiência com equipamentos modernos.'),
('Recepcionista', 'Administrativo', 'CLT', 'Atendimento ao público, agendamentos e suporte administrativo.', 'Ensino médio completo, boa comunicação, experiência em atendimento.');

-- ── Currículos ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS curriculos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    vaga_id INT UNSIGNED DEFAULT NULL,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(30) DEFAULT NULL,
    arquivo VARCHAR(512) DEFAULT NULL,
    mensagem TEXT DEFAULT NULL,
    lido TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Médicos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL,
    especialidade VARCHAR(150) NOT NULL,
    sub_especialidade VARCHAR(150) DEFAULT NULL,
    titulo VARCHAR(50) DEFAULT 'Dr.',
    crm VARCHAR(30) DEFAULT NULL,
    foto VARCHAR(512) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    ordem INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_especialidade (especialidade),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO medicos (nome, especialidade, sub_especialidade, titulo) VALUES
-- Cardiologia
('Roger Guerra', 'Cardiologia', NULL, 'Dr.'),
('Mario Ribeiro', 'Cardiologia', NULL, 'Dr.'),
('Larissa David', 'Cardiologia', NULL, 'Dra.'),
('José Simões', 'Cardiologia', NULL, 'Dr.'),
('Ludimila Sthefanie', 'Cardiologia', NULL, 'Dra.'),
('Rafael Carlos', 'Cardiologia', NULL, 'Dr.'),
('Luciano Matos', 'Cardiologia', NULL, 'Dr.'),
('Eder Oliveira', 'Cardiologia', NULL, 'Dr.'),
('Aldimar Suene', 'Cardiologia', NULL, 'Dra.'),
('Cleriston Santos', 'Cardiologia', NULL, 'Dr.'),
('Samuel Rangel', 'Cardiologia', NULL, 'Dr.'),
('Sifredo Pedral', 'Cardiologia', NULL, 'Dr.'),
-- Ortopedia
('Carlos Brandão', 'Ortopedia', 'Quadril', 'Dr.'),
('Antônio Brandão', 'Ortopedia', 'Coluna', 'Dr.'),
('Dackson Rocha', 'Ortopedia', 'Médico da Dor', 'Dr.'),
('Arthur Mendes', 'Ortopedia', 'Pé', 'Dr.'),
('Tiago Freire', 'Ortopedia', NULL, 'Dr.'),
('Rodolfo Ornelas', 'Ortopedia', 'Ombro', 'Dr.'),
('Vinícius Brito', 'Ortopedia', 'Quadril', 'Dr.'),
('Rafael Kulka', 'Ortopedia', 'Pé', 'Dr.'),
('Ítalo Dias', 'Ortopedia', 'Quadril', 'Dr.'),
('Lafaiete Andrade', 'Ortopedia', 'Médico da Dor', 'Dr.'),
('Joasser Andrade', 'Ortopedia', NULL, 'Dr.'),
('Rodrigo Mendonça', 'Ortopedia', NULL, 'Dr.'),
('Claudinei Alves', 'Ortopedia', 'Mão', 'Dr.'),
-- Neurologia / Neurocirurgia
('André Figueira', 'Neurologia', 'Eletroneuromiografia', 'Dr.'),
('Amanda', 'Neurologia', NULL, 'Dra.'),
('James Dean', 'Neurologia', NULL, 'Dr.'),
('Neilson', 'Neurocirurgia', NULL, 'Dr.'),
('Danilo Malta', 'Neurocirurgia', NULL, 'Dr.'),
('Kisley', 'Neurocirurgia', NULL, 'Dr.'),
('Maick Willen', 'Neurocirurgia', NULL, 'Dr.'),
('Gustavo Bilate', 'Neurocirurgia', NULL, 'Dr.'),
('Juliano Baptista', 'Neurocirurgia', NULL, 'Dr.'),
('Rafael de Queiroz', 'Neurocirurgia', NULL, 'Dr.'),
-- Cirurgia Geral
('Lucas Perucho', 'Cirurgia Geral', NULL, 'Dr.'),
('Carlos Nery', 'Cirurgia Geral', NULL, 'Dr.'),
('Eduardo Gondim', 'Cirurgia Geral', NULL, 'Dr.'),
('Jorge Faria', 'Cirurgia Geral', NULL, 'Dr.'),
('Mauricio Sarkis', 'Cirurgia Geral', NULL, 'Dr.'),
('João Marcos', 'Cirurgia Geral', NULL, 'Dr.'),
-- Cirurgia Cardiovascular
('Sidney', 'Cirurgia Cardiovascular', NULL, 'Dr.'),
('Murilo Malta', 'Cirurgia Cardiovascular', NULL, 'Dr.'),
-- Cirurgia de Coluna
('Renan Farias', 'Cirurgia de Coluna', NULL, 'Dr.'),
('Miguel Olavo', 'Cirurgia de Coluna', NULL, 'Dr.'),
-- Outras Cirurgias
('Jorge Tavares', 'Cirurgia', 'Cabeça e Pescoço', 'Dr.'),
('Paulo de Tarso', 'Cirurgia Plástica', NULL, 'Dr.'),
('Ariomar Rocha', 'Cirurgia Plástica', NULL, 'Dr.'),
('Paula', 'Cirurgia', 'Aparelho Digestivo', 'Dra.'),
('Antônio Penna', 'Cirurgia Torácica', NULL, 'Dr.'),
-- Pneumologia
('André Bezerra', 'Pneumologia', NULL, 'Dr.'),
('Natália Carvalho', 'Pneumologia', NULL, 'Dra.'),
-- Angiologia
('Luciano Dias', 'Angiologia', NULL, 'Dr.'),
('Sidneia', 'Angiologia', 'Doppler', 'Dra.'),
('Kataryne Simões', 'Angiologia', 'Doppler', 'Dra.'),
-- Bucomaxilofacial
('Rafael Queiroz', 'Bucomaxilofacial', NULL, 'Dr.'),
('Diego Maia', 'Bucomaxilofacial', NULL, 'Dr.'),
-- Urologia
('Leandro Dórea', 'Urologia', NULL, 'Dr.'),
('Carlos Eduardo Nery', 'Urologia', NULL, 'Dr.'),
-- Reumatologia
('Saulo Musse', 'Reumatologia', NULL, 'Dr.'),
('Sidney Nardele', 'Reumatologia', NULL, 'Dr.'),
-- Nefrologia
('Rita de Cassia', 'Nefrologia', NULL, 'Dra.'),
-- Infectologia
('Carolina Palmeira', 'Infectologia', NULL, 'Dra.'),
('Maressa', 'Infectologia', NULL, 'Dra.'),
-- Pediatria
('Claudimax', 'Pediatria', NULL, 'Dr.'),
('Alessandra Teixeira', 'Pediatria', NULL, 'Dra.'),
-- Oncologia
('Fillipe Dantas Pinheiro', 'Oncologia', NULL, 'Dr.'),
('Adriano Fernandes Teixeira', 'Oncologia', NULL, 'Dr.'),
-- Hematologia
('Luanna Silva Nunes', 'Hematologia', NULL, 'Dra.'),
('Menandro Cardoso', 'Hematologia', NULL, 'Dr.'),
('Maressa Guimarães', 'Hematologia', NULL, 'Dra.'),
-- Coloproctologia
('Marcelo', 'Coloproctologia', NULL, 'Dr.'),
('Indira', 'Coloproctologia', NULL, 'Dra.'),
('Alberto Santos', 'Coloproctologia', NULL, 'Dr.'),
-- Endocrinologia
('Cristiane Passamani', 'Endocrinologia', NULL, 'Dra.'),
('Livia Gesteiro', 'Endocrinologia', NULL, 'Dra.'),
-- Gastroenterologia
('Priscila Nogueira', 'Gastroenterologia', NULL, 'Dra.'),
('Widma Caitite Souza', 'Gastroenterologia', NULL, 'Dra.'),
-- Otorrinolaringologia
('Luciana Correia', 'Otorrinolaringologia', NULL, 'Dra.'),
-- Psicologia
('Iana', 'Psicologia', NULL, ''),
-- Oftalmologia
('Larissa', 'Oftalmologia', NULL, 'Dra.'),
('Diego Passos', 'Oftalmologia', NULL, 'Dr.'),
('Jefferson Porto', 'Oftalmologia', NULL, 'Dr.'),
('Daniel Coelho', 'Oftalmologia', NULL, 'Dr.'),
('Analu Bittencourt', 'Oftalmologia', NULL, 'Dra.'),
-- Dermatologia
('Mariana Bulhões', 'Dermatologia', NULL, 'Dra.'),
('Cristiane Passamane', 'Dermatologia', NULL, 'Dra.'),
('Paloma Gonçalves', 'Dermatologia', NULL, ''),
('Larissa Amorim', 'Dermatologia', NULL, 'Dra.'),
('Matheus das Neves', 'Dermatologia', NULL, 'Dr.');


-- IBR Hospital — Tabela: servicos_medicos
-- Execute este SQL no seu banco de dados

CREATE TABLE IF NOT EXISTS `servicos_medicos` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `titulo`         VARCHAR(120)  NOT NULL,
  `desc_curta`     VARCHAR(200)  NOT NULL,
  `desc_completa`  TEXT          NOT NULL,
  `imagem`         VARCHAR(500)  NOT NULL,
  `ordem`          TINYINT       NOT NULL DEFAULT 1,
  `status`         ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados de exemplo (opcional)
INSERT INTO `servicos_medicos` (`titulo`, `desc_curta`, `desc_completa`, `imagem`, `ordem`, `status`) VALUES
('Centro de Diagnósticos',
 'O IBR Hospital oferece mais de 20 tipos de exames, diagnósticos de imagens e análises clínicas.',
 'O IBR Hospital oferece mais de 20 tipos de exames, diagnósticos de imagens e análises clínicas — o que garante ao paciente comodidade e segurança com a realização de todas as solicitações médicas em um só espaço.\n\nConfira os serviços disponíveis: Raio-X; Endoscopia; Cintilografia; Colonoscopia; Hemodinâmica; Holter 3 canais; Angiotomografia; Ultrassonografia; Ecocardiograma; Eletrocardiograma; Eletroencefalograma; Teste ergométrico; Ressonância Magnética; Tomografia Computadorizada Multislice.',
 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=700&q=80',
 1, 'ativo'),

('Centro Médico',
 'O corpo clínico permanente é composto por equipes de especialistas de alta qualidade.',
 'O corpo clínico permanente é composto por equipes de especialistas em condições de prestar atendimento da mais alta qualidade aos nossos clientes.\n\nO serviço está dividido em centros especializados: Angiologia, Cardiologia, Cirurgia Geral, Endocrinologia, Dermatologia, Gastroenterologia, Nefrologia, Neurologia, Ortopedia, Reumatologia, Radiologia e Urologia.',
 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&q=80',
 2, 'ativo'),

('Cirurgia Geral',
 'O Serviço de Cirurgia do IBR segue todas as normas de segurança da OMS.',
 'O Serviço de Cirurgia do IBR segue todas as normas de segurança determinadas pela OMS — Organização Mundial de Saúde.\n\nO hospital mantém indicadores como taxa de infecção cirúrgica, número de reoperações e mortalidade, comparáveis às mais renomadas instituições do país. Além da cirurgia geral, são realizadas cirurgias torácicas, vasculares, ortopédicas, cardíacas, ginecológicas, oncológicas, estéticas, gastroplastias (bariátrica), urológicas e neurocirurgias.',
 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=700&q=80',
 3, 'ativo'),

('Emergência',
 'O Pronto-Socorro do IBR é capacitado para atendimentos de alta complexidade 24h.',
 'O Pronto-Socorro do Hospital IBR é capacitado para atendimentos de alta complexidade, com equipes formadas por especialistas multidisciplinares e equipamentos de última geração.\n\nReferência em pronto-atendimento, o IBR conta com os serviços de clínica geral, cardiologia, ortopedia, neurologia e cirurgia 24 horas.',
 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=700&q=80',
 4, 'ativo'),

('Hemodinâmica',
 'Serviço dedicado a diagnósticos e procedimentos terapêuticos via cateterismo e angioplastia.',
 'O Serviço de Hemodinâmica se dedica à realização de diagnósticos e procedimentos terapêuticos utilizando a técnica do cateterismo e da angioplastia.\n\nO exame de cateterismo tem por finalidade diagnosticar possíveis obstruções das artérias coronárias. Já a angioplastia é o procedimento indicado para o tratamento, permitindo que o sangue volte a fluir livremente.',
 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=700&q=80',
 5, 'ativo'),

('Internamento',
 'O internamento pode ser eletivo (agendado) ou de emergência, por convênios ou particular.',
 'O internamento pode ser eletivo (agendado) ou de emergência, por convênios ou particular.\n\nA unidade de internação, em mais de 40 leitos disponíveis, oferece excelente estrutura física, suporte humano e todos os equipamentos técnicos necessários para os cuidados do paciente. O Hospital conta com serviços de plantão médico, programas de PCI, enfermagem capacitada, acompanhamento nutricional e fisioterapêutico.',
 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=700&q=80',
 6, 'ativo'),

('Unidade de Terapia Intensiva (UTI)',
 'A UTI geral do IBR Hospital possui 18 leitos em conformidade com os protocolos de segurança.',
 'A UTI geral do IBR Hospital possui 18 leitos, entre áreas individualizadas e coletivas, todos em conformidade com os protocolos de segurança.\n\nA equipe assistencial é composta por especialistas em medicina intensiva, psicólogos, fisioterapeutas, nutricionistas, enfermeiros e técnicos. O paciente criticamente doente encontra apoio técnico e humano para superar intercorrências agudas.',
 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=700&q=80',
 7, 'ativo');

 -- Execute no seu banco de dados MySQL
-- IBR Hospital — Tabela servicos_medicos

CREATE TABLE IF NOT EXISTS `servicos_medicos` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `titulo`         VARCHAR(120)  NOT NULL,
  `desc_curta`     VARCHAR(200)  NOT NULL,
  `desc_completa`  TEXT          NOT NULL,
  `imagem`         VARCHAR(500)  NOT NULL,
  `ordem`          TINYINT       NOT NULL DEFAULT 1,
  `status`         ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- IBR Hospital — Especialidades
-- Execute no seu banco de dados MySQL (phpMyAdmin ou HeidiSQL)
-- A tabela já deve existir (criada pelo PHP automaticamente)
-- Se não existir, o CREATE TABLE IF NOT EXISTS abaixo cria ela também

CREATE TABLE IF NOT EXISTS `especialidades` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `titulo`         VARCHAR(120)  NOT NULL,
  `desc_curta`     VARCHAR(200)  NOT NULL,
  `desc_completa`  TEXT          NOT NULL,
  `imagem`         VARCHAR(500)  NOT NULL,
  `ordem`          TINYINT       NOT NULL DEFAULT 1,
  `status`         ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Limpa dados anteriores (caso queira reinserir)
-- DELETE FROM especialidades;

-- Insere as 9 especialidades
INSERT INTO `especialidades` (`titulo`, `desc_curta`, `desc_completa`, `imagem`, `ordem`, `status`) VALUES

('Cardiologia',
 'O IBR Cardio está amplamente capacitado a oferecer desde os mais simples diagnósticos e tratamentos, até situações de maior risco e complexidade cardíaca.',
 'O IBR Cardio está amplamente capacitado a oferecer desde os mais simples diagnósticos e tratamentos, até o atendimento de situações de maior risco e complexidade cardíaca.\n\nO hospital conta com uma moderna unidade coronariana, enfermagem especializada e cardiologistas de plantão 24h. O serviço dispõe de médicos renomados na área e toda tecnologia necessária para o suporte imediato ao paciente. Rotineiramente são realizados desde simples eletrocardiogramas até exames de imagem mais sofisticados, como ressonância magnética, angiotomografia, cintilografia, bem como procedimentos invasivos e cirúrgicos no Centro de Hemodinâmica.',
 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&q=80',
 1, 'ativo'),

('Dermatologia',
 'Através do atendimento ambulatorial, o IBR conta com médico especialista para o diagnóstico, tratamento e prevenção de doenças da pele, pelos, mucosas, cabelos e unhas.',
 'Através do atendimento ambulatorial, o IBR conta com médico especialista para o diagnóstico, tratamento e prevenção de doenças da pele, pelos, mucosas, cabelos e unhas.\n\nMais de 3.000 doenças dermatológicas afetam a saúde de crianças, adultos e idosos. O dermatologista é o profissional indicado para o cuidado da acne (espinhas), alergias, vitiligo, psoríase, queda de cabelos, hanseníase (lepra) e câncer da pele — tipo mais frequente no país que apresenta altos índices de cura quando detectado precocemente.',
 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=700&q=80',
 2, 'ativo'),

('Endocrinologia',
 'Com atendimento ambulatorial, o hospital dispõe do serviço de endocrinologia. Conheça os campos de atuação deste especialista.',
 'Com atendimento ambulatorial, o hospital dispõe do serviço de endocrinologia. Você sabe de que forma este especialista pode ajudar? Conheça os campos de atuação:\n\nObesidade; Diabetes; Tireoide; Distúrbios do crescimento; Colesterol e Triglicerídeos; Distúrbios da puberdade; Menopausa; Ginecomastia; Osteoporose; Andropausa; Doenças da Hipófose (glândula no cérebro) e Supra-Renal (glândula nos rins).',
 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=700&q=80',
 3, 'ativo'),

('Gastroenterologia',
 'Conveniado ao IAD (Instituto do Aparelho Digestivo), o IBR Hospital dispõe de serviço completo para diagnóstico e tratamento das doenças do aparelho digestório.',
 'Com atendimento ambulatorial e cirúrgico — conveniado ao IAD (Instituto do Aparelho Digestivo) — o IBR Hospital dispõe de um serviço completo para diagnóstico e tratamento das doenças que envolvem o aparelho digestório.\n\nÓrgãos como boca, esôfago, estômago, intestino grosso, intestino delgado, fígado, pâncreas, vesícula biliar, cólon ou íleo e suas possíveis doenças, são tratados pelo Gastroenterologista. Os exames mais comuns são dois: endoscopia e colonoscopia.',
 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=700&q=80',
 4, 'ativo'),

('Nefrologia',
 'Recomenda-se que pacientes com mais de 40 anos façam anualmente consulta com nefrologista e exames de dosagem da creatinina no sangue e de urina.',
 'Recomenda-se que pacientes com mais de 40 anos façam anualmente uma consulta médica com um médico nefrologista e façam os exames de dosagem da creatinina no sangue e o exame de urina.\n\nEntre as diversas atividades de um médico nefrologista, pode-se destacar: prevenção, diagnóstico e tratamento infecções urinárias; nefrites; litíase renal (pedra nos rins); doenças renais císticas e crônicas; lesão renal aguda e hemodiálise.',
 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=700&q=80',
 5, 'ativo'),

('Neurologia',
 'A Neurologia Clínica do IBR é responsável pelas urgências e exames com funcionamento 24 horas — a unidade é referência em suporte para o paciente com AVC.',
 'A Neurologia Clínica do IBR é responsável pelas urgências e exames com funcionamento 24 horas — a unidade é referência em suporte para o paciente com AVC.\n\nUma série de diferenciais torna o IBR Hospital o único centro de atendimento, no interior da Bahia, capacitado para reverter totalmente o AVC isquêmico e hemorrágico — até 3 horas depois do ocorrido. Com serviço estendido à toda comunidade — paciente SUS, conveniado e particular — o IBR conta com uma equipe de médicos, neurologistas e neurocirurgiões, e enfermeiros habilitados para a assistência durante todo o período de internação e reabilitação.',
 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=700&q=80',
 6, 'ativo'),

('Ortopedia',
 'O IBR Hospital conta com programa em Ortopedia e Traumatologia com 12 médicos titulares certificados pela Sociedade Brasileira de Ortopedia e Traumatologia.',
 'O IBR Hospital conta com um verdadeiro programa em Ortopedia e Traumatologia sendo referência na área há mais de uma década. O serviço é composto por 12 médicos titulares certificados pela Sociedade Brasileira de Ortopedia e Traumatologia em todas as suas subespecialidades.\n\nO atendimento segue os padrões dos melhores centros com especialistas capacitados para prevenir, diagnosticar e tratar doenças e lesões do ombro, mão, punho, quadril, joelho, tornozelo, pé e coluna vertebral. Os procedimentos realizados incluem cirurgias minimamente invasivas, preservadoras e reconstrutivas com um acompanhamento que permite uma melhor evolução clínica, menor tempo de internação e melhora da qualidade de vida após a alta do paciente.',
 'https://images.unsplash.com/photo-1588776814546-daab30f310ce?w=700&q=80',
 7, 'ativo'),

('Pneumologia',
 'Sintomas respiratórios estão entre as primeiras causas de procura por hospitais e alto índice de mortalidade. O IBR conta com pneumologistas para atendimento clínico e cirúrgico.',
 'Sintomas respiratórios estão entre as primeiras causas de procura por hospitais e alto índice de mortalidade — câncer.\n\nPorém é muito comum, por exemplo, se atribuir o sintoma de falta de ar a outras causas que não o pulmão. Para um melhor diagnóstico e tratamento de diversas doenças, o IBR conta com pneumologistas para atendimento clínico e cirúrgico.',
 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=700&q=80',
 8, 'ativo'),

('Radiologia',
 'Radiologia é a parte da ciência que estuda a visualização de ossos, órgãos ou estruturas através do uso de radiações gerando desta maneira uma imagem.',
 'Radiologia é a parte da ciência que estuda a visualização de ossos, órgãos ou estruturas através do uso de radiações (sonoras e eletromagnéticas) gerando desta maneira uma imagem.\n\nDoenças e condições clínicas que antes eram diagnosticadas apenas por métodos invasivos contam com modernos exames de rastreio e diagnóstico — com destaque especial para as máquinas de tomografia computadorizada (TC) e ressonância magnética (RM).',
 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=700&q=80',
 9, 'ativo');