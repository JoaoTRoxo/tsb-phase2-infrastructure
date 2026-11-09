// Demo content, in English and European Portuguese. Used by the seed script to
// populate a fresh CMS, and by the site build when no CMS is configured.

const p = (text) => ({ type: 'paragraph', children: [{ type: 'text', text }] });
const h2 = (text) => ({ type: 'heading', level: 2, children: [{ type: 'text', text }] });
const quote = (text) => ({ type: 'quote', children: [{ type: 'text', text }] });

export const tags = [
  { slug: 'hiking', name: 'Hiking', namePt: 'Caminhadas' },
  { slug: 'islands', name: 'Islands', namePt: 'Ilhas' },
  { slug: 'desert', name: 'Desert', namePt: 'Deserto' },
  { slug: 'cities', name: 'Cities', namePt: 'Cidades' },
  { slug: 'sea', name: 'Sea', namePt: 'Mar' },
  { slug: 'mountains', name: 'Mountains', namePt: 'Montanhas' },
  { slug: 'trains', name: 'Trains', namePt: 'Comboios' },
  { slug: 'lakes', name: 'Lakes', namePt: 'Lagos' },
];

export const authors = [
  {
    slug: 'ines-carvalho',
    name: 'Inês Carvalho',
    avatar: 'avatar-ines',
    role: 'Editor and hiker',
    rolePt: 'Editora e caminhante',
    bio: 'Grew up at the foot of the Serra da Estrela and has been walking away from it ever since. Plans every trip around a map and regrets none of the detours.',
    bioPt: 'Cresceu no sopé da Serra da Estrela e desde então nunca parou de caminhar para longe dela. Planeia cada viagem com um mapa e não se arrepende de nenhum desvio.',
    homeBase: 'Covilhã',
    order: 1,
  },
  {
    slug: 'tomas-figueira',
    name: 'Tomás Figueira',
    avatar: 'avatar-tomas',
    role: 'Sea and islands correspondent',
    rolePt: 'Correspondente de mar e ilhas',
    bio: 'A former deckhand who writes about the places you can only reach by boat, and about the people who stay after the ferry leaves.',
    bioPt: 'Antigo marinheiro que escreve sobre os lugares onde só se chega de barco, e sobre as pessoas que ficam depois de o ferry partir.',
    homeBase: 'Ponta Delgada',
    order: 2,
  },
  {
    slug: 'marta-lopes',
    name: 'Marta Lopes',
    avatar: 'avatar-marta',
    role: 'Photographer',
    rolePt: 'Fotógrafa',
    bio: 'Gets up before everyone else for the light, then spends the rest of the day pretending she is not tired. Runs the gallery.',
    bioPt: 'Levanta-se antes de toda a gente por causa da luz e passa o resto do dia a fingir que não está cansada. É responsável pela galeria.',
    homeBase: 'Lisboa',
    order: 3,
  },
];

export const articles = [
  {
    cover: 'cover-uyuni',
    date: '2026-10-18',
    location: 'Salar de Uyuni, Bolivia',
    author: 'marta-lopes',
    tags: ['desert', 'lakes'],
    en: {
      title: 'The Salt Flat That Forgets the Horizon',
      slug: 'the-salt-flat-that-forgets-the-horizon',
      excerpt: 'Three days on the largest salt flat on Earth, where a thin film of rain turns the ground into sky and every distance becomes a guess.',
      body: [
        p('We left Uyuni before dawn in a jeep that had stopped pretending to have suspension. For the first hour the salt was only a paler kind of dark. Then the sun came up behind us and the world resolved into two colours, one above the other, with nothing to tell you where they met.'),
        h2('Walking on the mirror'),
        p('It had rained the night before, a few millimetres, no more. That is all it takes. The salt stays flat to within a metre across more than ten thousand square kilometres, so the water has nowhere to go, and it sits there perfectly still and reflects everything. Our driver switched off the engine and told us to get out and walk.'),
        quote('You stop trusting your eyes after a while. Then you stop minding.'),
        p('Distance goes first. A hill that looks an hour away is a day away; a dark speck is a cyclist, then a truck, then a cyclist again. By the second afternoon we had given up guessing. We photographed it badly and happily, and each picture looks like an error in the file.'),
      ],
    },
    pt: {
      title: 'O salar que esquece o horizonte',
      slug: 'o-salar-que-esquece-o-horizonte',
      excerpt: 'Três dias no maior salar da Terra, onde uma fina camada de chuva transforma o chão em céu e cada distância se torna um palpite.',
      body: [
        p('Saímos de Uyuni antes do amanhecer num jipe que já deixara de fingir que tinha suspensão. Durante a primeira hora, o sal era apenas uma espécie mais pálida de escuro. Depois o sol nasceu atrás de nós e o mundo resolveu-se em duas cores, uma por cima da outra, sem nada que dissesse onde se encontravam.'),
        h2('A caminhar sobre o espelho'),
        p('Tinha chovido na noite anterior, alguns milímetros, não mais do que isso. É quanto basta. O sal mantém-se plano ao longo de mais de dez mil quilómetros quadrados, por isso a água não tem para onde ir e fica ali, imóvel, a refletir tudo. O nosso condutor desligou o motor e disse-nos para sairmos e caminharmos.'),
        quote('Ao fim de algum tempo deixamos de confiar nos olhos. Depois deixa de nos importar.'),
        p('A distância é a primeira a desaparecer. Uma colina que parece a uma hora de caminho está a um dia; um ponto escuro é um ciclista, depois um camião, depois outra vez um ciclista. Na segunda tarde já tínhamos desistido de adivinhar. Fotografámos tudo mal e felizes, e cada imagem parece um erro no ficheiro.'),
      ],
    },
  },
  {
    cover: 'cover-lofoten',
    date: '2026-09-02',
    location: 'Lofoten, Norway',
    author: 'tomas-figueira',
    tags: ['islands', 'sea', 'mountains'],
    en: {
      title: 'Night Ferry to the Lofoten',
      slug: 'night-ferry-to-the-lofoten',
      excerpt: 'Four hours across the Vestfjord in late summer, with the mountains arriving one at a time out of a sky that never quite gets dark.',
      body: [
        p('The ferry from Bodø leaves at an hour that only makes sense this far north. It was past eleven and the light was the colour of weak tea. On the car deck, two fishermen were sharing a thermos and arguing, peacefully, about a boat neither of them owned.'),
        h2('A wall that turns into islands'),
        p('From the mainland the Lofoten look like a single wall standing in the sea. The crossing takes it apart slowly. First the wall develops shadows, then gaps, and somewhere past the middle of the fjord it stops being one thing and becomes dozens of peaks with water running between them.'),
        p('We came into Moskenes a little after three. Nothing was open and nobody seemed to mind. The whole village was pink. I walked up the road until I could see the ferry turn around, and stayed until it was small.'),
      ],
    },
    pt: {
      title: 'Ferry noturno para as Lofoten',
      slug: 'ferry-noturno-para-as-lofoten',
      excerpt: 'Quatro horas a atravessar o Vestfjord no final do verão, com as montanhas a chegarem uma a uma de um céu que nunca chega a escurecer.',
      body: [
        p('O ferry de Bodø parte a uma hora que só faz sentido tão a norte. Já passava das onze e a luz tinha a cor de chá fraco. No convés dos carros, dois pescadores partilhavam um termo e discutiam, pacificamente, sobre um barco que nenhum deles possuía.'),
        h2('Uma muralha que se transforma em ilhas'),
        p('Vistas do continente, as Lofoten parecem uma única muralha erguida no mar. A travessia desmonta-a devagar. Primeiro a muralha ganha sombras, depois falhas, e algures a meio do fiorde deixa de ser uma só coisa e passa a ser dezenas de picos com a água a correr entre eles.'),
        p('Chegámos a Moskenes pouco depois das três. Não havia nada aberto e ninguém parecia importar-se. A aldeia inteira estava cor-de-rosa. Subi a estrada até conseguir ver o ferry a dar a volta, e fiquei até ele se tornar pequeno.'),
      ],
    },
  },
  {
    cover: 'cover-kiso',
    date: '2026-07-21',
    location: 'Kiso Valley, Japan',
    author: 'ines-carvalho',
    tags: ['trains', 'hiking', 'mountains'],
    en: {
      title: 'A Slow Train Through the Kiso Valley',
      slug: 'a-slow-train-through-the-kiso-valley',
      excerpt: 'The old post road between Magome and Tsumago is eight kilometres long. We took all day, and could have taken longer.',
      body: [
        p('The Chuo line follows the Kiso River up through forest so dense that from the window it looks like a single dark animal. At Nakatsugawa we changed to a bus and then to our feet.'),
        h2('The road the couriers used'),
        p('For centuries this was one of the two great routes between Kyoto and Edo, and the post towns along it existed to feed and house the people on it. Magome and Tsumago have been restored with a care that stops just short of embalming. The electric wires are buried. The shops close at five.'),
        p('Between the towns there is only the path, a few stone steps at a time, and small brass bells hung at intervals to scare away bears. You ring each one as you pass. By the fifth, it had stopped feeling like a precaution and started feeling like saying hello.'),
      ],
    },
    pt: {
      title: 'Um comboio lento pelo vale de Kiso',
      slug: 'um-comboio-lento-pelo-vale-de-kiso',
      excerpt: 'A antiga estrada postal entre Magome e Tsumago tem oito quilómetros. Demorámos o dia inteiro, e podíamos ter demorado mais.',
      body: [
        p('A linha Chuo segue o rio Kiso através de uma floresta tão densa que, vista da janela, parece um único animal escuro. Em Nakatsugawa mudámos para um autocarro e depois para os nossos pés.'),
        h2('A estrada dos mensageiros'),
        p('Durante séculos, esta foi uma das duas grandes rotas entre Quioto e Edo, e as vilas postais existiam para alimentar e alojar quem a percorria. Magome e Tsumago foram restauradas com um cuidado que fica mesmo a tempo de não ser embalsamamento. Os fios elétricos estão enterrados. As lojas fecham às cinco.'),
        p('Entre as vilas há apenas o caminho, alguns degraus de pedra de cada vez, e pequenos sinos de latão pendurados a intervalos para afugentar os ursos. Toca-se em cada um ao passar. Ao quinto, já não parecia uma precaução e começava a parecer um cumprimento.'),
      ],
    },
  },
  {
    cover: 'cover-lisbon',
    date: '2026-05-30',
    location: 'Lisbon, Portugal',
    author: 'marta-lopes',
    tags: ['cities'],
    en: {
      title: 'Lisbon Before the Trams Wake',
      slug: 'lisbon-before-the-trams-wake',
      excerpt: 'Between five and seven in the morning the city belongs to bakers, street sweepers and one very determined photographer.',
      body: [
        p('At five the hills are still doing what they were built to do, which is to hide one part of the city from another. Alfama has no idea what Graça is up to. I started at the bottom of Rua da Bica with a thermos and no particular plan.'),
        h2('The light comes from the river'),
        p('The first colour arrives from below, reflected up off the Tagus onto the undersides of the balconies. For about twelve minutes every wall looks freshly painted. Then the sun clears the far bank and it is an ordinary, beautiful city again.'),
        p('The bakery on the corner of my street opens its side door at six, and if you know to knock you can buy bread that has not yet been told it is for sale. By the time the 28 came rattling past, I had eaten two and taken almost nothing worth keeping. It was a very good morning.'),
      ],
    },
    pt: {
      title: 'Lisboa antes de os elétricos acordarem',
      slug: 'lisboa-antes-de-os-eletricos-acordarem',
      excerpt: 'Entre as cinco e as sete da manhã, a cidade pertence aos padeiros, aos varredores e a uma fotógrafa muito determinada.',
      body: [
        p('Às cinco, as colinas ainda estão a fazer aquilo para que foram feitas, que é esconder uma parte da cidade da outra. Alfama não faz ideia do que a Graça anda a fazer. Comecei no fundo da Rua da Bica com um termo e sem nenhum plano em particular.'),
        h2('A luz vem do rio'),
        p('A primeira cor chega de baixo, refletida no Tejo para a parte inferior das varandas. Durante cerca de doze minutos, todas as paredes parecem acabadas de pintar. Depois o sol ultrapassa a outra margem e volta a ser uma cidade comum e bonita.'),
        p('A padaria da esquina da minha rua abre a porta lateral às seis e, se soubermos bater, podemos comprar pão a que ainda ninguém disse que estava à venda. Quando o 28 passou a chocalhar, já tinha comido dois e não tinha tirado quase nada que valesse a pena guardar. Foi uma excelente manhã.'),
      ],
    },
  },
  {
    cover: 'cover-sahara',
    date: '2026-03-14',
    location: 'Erg Chebbi, Morocco',
    author: 'tomas-figueira',
    tags: ['desert'],
    en: {
      title: 'What the Desert Teaches About Silence',
      slug: 'what-the-desert-teaches-about-silence',
      excerpt: 'A sailor spends three nights in the dunes of Erg Chebbi and discovers that the sea, by comparison, never stops talking.',
      body: [
        p('I have spent most of my life on boats, and I thought I knew about quiet. I did not. A boat creaks, the water knocks, a rope somewhere is always complaining. At Erg Chebbi, once the wind drops, there is nothing at all, and your own pulse becomes the loudest thing for fifty kilometres.'),
        h2('A sea that holds still'),
        p('The dunes behave like waves filmed at the wrong speed. They have crests and troughs and a windward side, and they move, a few metres in a year. Our guide, Youssef, navigated with no instruments and a great deal of tea.'),
        quote('You sailors always want to know where you are. Here it is better to know when.'),
        p('He meant the heat. We walked before ten and after five, and between those hours we lay in the shade and let the day go by. I have not been so bored or so happy since I was nine years old.'),
      ],
    },
    pt: {
      title: 'O que o deserto ensina sobre o silêncio',
      slug: 'o-que-o-deserto-ensina-sobre-o-silencio',
      excerpt: 'Um marinheiro passa três noites nas dunas de Erg Chebbi e descobre que o mar, em comparação, nunca se cala.',
      body: [
        p('Passei a maior parte da vida em barcos e julgava saber o que era o sossego. Não sabia. Um barco range, a água bate, há sempre um cabo algures a queixar-se. Em Erg Chebbi, quando o vento cai, não há absolutamente nada, e o nosso próprio pulso torna-se a coisa mais ruidosa num raio de cinquenta quilómetros.'),
        h2('Um mar que fica quieto'),
        p('As dunas comportam-se como ondas filmadas à velocidade errada. Têm cristas e cavados e um lado virado ao vento, e movem-se, alguns metros por ano. O nosso guia, Youssef, orientava-se sem instrumentos e com muito chá.'),
        quote('Vocês, marinheiros, querem sempre saber onde estão. Aqui é melhor saber quando.'),
        p('Referia-se ao calor. Caminhávamos antes das dez e depois das cinco e, entre essas horas, ficávamos deitados à sombra a deixar passar o dia. Não me sentia tão aborrecido nem tão feliz desde os nove anos.'),
      ],
    },
  },
  {
    cover: 'cover-azores',
    date: '2026-01-25',
    location: 'São Miguel, Azores',
    author: 'ines-carvalho',
    tags: ['hiking', 'islands', 'lakes'],
    en: {
      title: 'Seven Days Along the Spine of São Miguel',
      slug: 'seven-days-along-the-spine-of-sao-miguel',
      excerpt: 'From Sete Cidades to Nordeste on foot, in the green and dripping heart of an Azorean winter.',
      body: [
        p('The forecast for the entire week was the same small icon of a cloud with both the sun and the rain coming out of it. By the second day we understood that this was not a forecast but a description of the island.'),
        h2('Two lakes, one story'),
        p('Sete Cidades sits in a crater, and its two lakes, one green and one blue, are said to be the tears of a shepherd and a princess. We reached the rim at the Vista do Rei after a morning in the cloud, and for maybe four minutes the air cleared and the whole story was laid out below us. Then it closed again.'),
        p('After that the walk runs east along the high ground, past hydrangea hedges gone brown for the winter, past cows who regard you with the patience of civil servants. At Nordeste the path simply stops at the sea. We sat on the wall and ate what was left of the cheese.'),
      ],
    },
    pt: {
      title: 'Sete dias pela espinha de São Miguel',
      slug: 'sete-dias-pela-espinha-de-sao-miguel',
      excerpt: 'De Sete Cidades ao Nordeste a pé, no coração verde e encharcado de um inverno açoriano.',
      body: [
        p('A previsão para a semana inteira era o mesmo pequeno ícone de uma nuvem com o sol e a chuva a sairem dela ao mesmo tempo. Ao segundo dia percebemos que aquilo não era uma previsão, mas uma descrição da ilha.'),
        h2('Duas lagoas, uma história'),
        p('As Sete Cidades ficam numa cratera e diz-se que as suas duas lagoas, uma verde e outra azul, são as lágrimas de um pastor e de uma princesa. Chegámos à orla na Vista do Rei depois de uma manhã dentro da nuvem e, durante uns quatro minutos, o ar abriu e a história inteira ficou estendida à nossa frente. Depois voltou a fechar.'),
        p('A partir daí o caminho segue para leste pelas terras altas, ao longo de sebes de hortênsias castanhas do inverno e de vacas que nos observam com a paciência de funcionários públicos. No Nordeste, o caminho simplesmente acaba no mar. Sentámo-nos no muro e comemos o que restava do queijo.'),
      ],
    },
  },
];

export const gallery = [
  { image: 'gallery-01', takenOn: '2026-09-04', location: 'Reine, Norway', author: 'marta-lopes', tags: ['sea', 'islands'], en: { title: 'Harbour at low sun', caption: 'The last boat of the day coming round the point.' }, pt: { title: 'Porto ao sol baixo', caption: 'O último barco do dia a contornar a ponta.' } },
  { image: 'gallery-02', takenOn: '2026-07-23', location: 'Tsumago, Japan', author: 'marta-lopes', tags: ['hiking', 'mountains'], en: { title: 'Cedar line', caption: 'Morning mist on the old post road.' }, pt: { title: 'Linha de cedros', caption: 'Neblina matinal na antiga estrada postal.' } },
  { image: 'gallery-03', takenOn: '2026-03-16', location: 'Erg Chebbi, Morocco', author: 'tomas-figueira', tags: ['desert'], en: { title: 'Evening ridge', caption: 'Ten minutes before the colour went.' }, pt: { title: 'Crista ao entardecer', caption: 'Dez minutos antes de a cor desaparecer.' } },
  { image: 'gallery-04', takenOn: '2026-02-11', location: 'Serra da Estrela, Portugal', author: 'ines-carvalho', tags: ['mountains', 'hiking'], en: { title: 'Cold ridgelines', caption: 'Five layers of Estrela in winter.' }, pt: { title: 'Cumeadas frias', caption: 'Cinco camadas de Estrela no inverno.' } },
  { image: 'gallery-05', takenOn: '2026-05-30', location: 'Lisbon, Portugal', author: 'marta-lopes', tags: ['cities'], en: { title: 'Before the first tram', caption: 'A few windows are already awake.' }, pt: { title: 'Antes do primeiro elétrico', caption: 'Algumas janelas já estão acordadas.' } },
  { image: 'gallery-06', takenOn: '2026-10-19', location: 'Salar de Uyuni, Bolivia', author: 'marta-lopes', tags: ['lakes', 'desert'], en: { title: 'Copper water', caption: 'A centimetre deep and as far as you can see.' }, pt: { title: 'Água de cobre', caption: 'Um centímetro de fundo e a perder de vista.' } },
  { image: 'gallery-07', takenOn: '2026-09-06', location: 'Moskenes, Norway', author: 'tomas-figueira', tags: ['mountains', 'islands'], en: { title: 'Midnight, more or less', caption: 'The sun gave up, but only briefly.' }, pt: { title: 'Meia-noite, mais ou menos', caption: 'O sol desistiu, mas só por pouco tempo.' } },
  { image: 'gallery-08', takenOn: '2026-01-27', location: 'São Miguel, Azores', author: 'ines-carvalho', tags: ['hiking', 'islands'], en: { title: 'Pines above Furnas', caption: 'Half an hour without rain, a local record.' }, pt: { title: 'Pinheiros sobre as Furnas', caption: 'Meia hora sem chuva, um recorde local.' } },
  { image: 'gallery-09', takenOn: '2026-06-12', location: 'Corvo, Azores', author: 'tomas-figueira', tags: ['sea', 'islands'], en: { title: 'Western edge', caption: 'The next stop from here is Newfoundland.' }, pt: { title: 'Extremo ocidental', caption: 'A próxima paragem daqui é a Terra Nova.' } },
  { image: 'gallery-10', takenOn: '2026-03-15', location: 'Merzouga, Morocco', author: 'marta-lopes', tags: ['desert'], en: { title: 'Noon dunes', caption: 'Nobody else was foolish enough to be out.' }, pt: { title: 'Dunas ao meio-dia', caption: 'Mais ninguém foi tolo o suficiente para sair.' } },
  { image: 'gallery-11', takenOn: '2026-05-31', location: 'Porto, Portugal', author: 'ines-carvalho', tags: ['cities'], en: { title: 'Roofs and a clear day', caption: 'From the top of the Clérigos stairs.' }, pt: { title: 'Telhados num dia limpo', caption: 'Do cimo das escadas dos Clérigos.' } },
  { image: 'gallery-12', takenOn: '2026-01-29', location: 'Sete Cidades, Azores', author: 'tomas-figueira', tags: ['lakes', 'islands'], en: { title: 'The blue lake', caption: 'Or the green one. Depends on the hour.' }, pt: { title: 'A lagoa azul', caption: 'Ou a verde. Depende da hora.' } },
];
