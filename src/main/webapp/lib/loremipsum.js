/* Lorem Ipsum Generator
 * (CC-BY) Fredrik Bridell <fredrik@bridell.com> 2009
 * Version 0.21 - multilingual
 * Released under a Creative Commons Attribution License
 *
 * You are welcome to use, share, modify, print, frame, or do whatever you like with this 
 * software, including commercial use. My only request is that you tell the world where you found it.
 * 
 * One way is to include the phrase: 
 * "Using the The Lorem Ipsum Generator by Fredrik Bridell (http://bridell.com/loremipsum/)"
 *
 * To use this on your web page: download the .js file and place it on your web server (please
 * do not include it from my server). In your html file, include the markup
 * <script type="text/javascript" src="loremipsum.js" />
 * (In the head or in the body).
 *
 * Where you want the Lorem Ipsum, include this markup:
 * <script type="text/javascript">loremIpsumParagraph(100)</script>
 * The number is the number of words in the paragraph. 
 */ 

/* Latin words, These are all the words in the first 100 lines of Ovid's Metamorphoses, Liber I. */
var latin =["ab", "aberant", "abscidit", "acervo", "ad", "addidit", "adhuc", "adsiduis", "adspirate", "aequalis", "aer", "aera", "aere", "aeris", "aestu", "aetas", "aethera", "aethere", "agitabilis", "aliis", "aliud", "alta", "altae", "alto", "ambitae", "amphitrite", "animal", "animalia", "animalibus", "animus", "ante", "aquae", "arce", "ardentior", "astra", "aurea", "auroram", "austro", "bene", "boreas", "bracchia", "caeca", "caecoque", "caeleste", "caeli", "caelo", "caelum", "caelumque", "caesa", "calidis", "caligine", "campoque", "campos", "capacius", "carentem", "carmen", "cepit", "certis", "cesserunt", "cetera", "chaos:", "cingebant", "cinxit", "circumdare", "circumfluus", "circumfuso", "coegit", "coeperunt", "coeptis", "coercuit", "cognati", "colebat", "concordi", "congeriem", "congestaque", "consistere", "contraria", "conversa", "convexi", "cornua", "corpora", "corpore", "crescendo", "cum", "cuncta", "cura", "declivia", "dedit", "deducite", "deerat", "dei", "densior", "deorum", "derecti", "descenderat", "deus", "dextra", "di", "dicere", "diffundi", "diremit", "discordia", "dispositam", "dissaepserat", "dissociata", "distinxit", "diu", "diversa", "diverso", "divino", "dixere", "dominari", "duae", "duas", "duris", "effervescere", "effigiem", "egens", "elementaque", "emicuit", "ensis", "eodem", "erant", "erat", "erat:", "erectos", "est", "et", "eurus", "evolvit", "exemit", "extendi", "fabricator", "facientes", "faecis", "fecit", "feras", "fert", "fidem", "figuras", "finxit", "fixo", "flamina", "flamma", "flexi", "fluminaque", "fontes", "foret", "forma", "formaeque", "formas", "fossae", "fratrum", "freta", "frigida", "frigore", "fronde", "fuerant", "fuerat", "fuit", "fulgura", "fulminibus", "galeae", "gentes", "glomeravit", "grandia", "gravitate", "habendum", "habentem", "habentia", "habitabilis", "habitandae", "haec", "hanc", "his", "homini", "hominum", "homo", "horrifer", "humanas", "hunc", "iapeto", "ignea", "igni", "ignotas", "illas", "ille", "illi", "illic", "illis", "imagine", "in", "inclusum", "indigestaque", "induit", "iners", "inmensa", "inminet", "innabilis", "inposuit", "instabilis", "inter", "invasit", "ipsa", "ita", "iudicis", "iuga", "iunctarum", "iussit", "lacusque", "lanient", "lapidosos", "lege", "legebantur", "levitate", "levius", "liberioris", "librata", "ligavit:", "limitibus", "liquidas", "liquidum", "litem", "litora", "locavit", "locis", "locoque", "locum", "longo", "lucis", "lumina", "madescit", "magni", "manebat", "mare", "margine", "matutinis", "mea", "media", "meis", "melior", "melioris", "membra", "mentes", "mentisque", "metusque", "militis", "minantia", "mixta", "mixtam", "moderantum", "modo", "moles", "mollia", "montes", "montibus", "mortales", "motura", "mundi", "mundo", "mundum", "mutastis", "mutatas", "nabataeaque", "nam", "natura", "naturae", "natus", "ne", "nebulas", "nec", "neu", "nisi", "nitidis", "nix", "non", "nondum", "norant", "nova", "nubes", "nubibus", "nullaque", "nulli", "nullo", "nullus", "numero", "nunc", "nuper", "obliquis", "obsistitur", "obstabatque", "occiduo", "omni", "omnia", "onerosior", "onus", "opifex", "oppida", "ora", "orba", "orbe", "orbem", "orbis", "origine", "origo", "os", "otia", "pace", "parte", "partim", "passim", "pendebat", "peragebant", "peregrinum", "permisit", "perpetuum", "persidaque", "perveniunt", "phoebe", "pinus", "piscibus", "plagae", "pluvialibus", "pluviaque", "poena", "pondere", "ponderibus", "pondus", "pontus", "porrexerat", "possedit", "posset:", "postquam", "praebebat", "praecipites", "praeter", "premuntur", "pressa", "prima", "primaque", "principio", "pro", "pronaque", "proxima", "proximus", "pugnabant", "pulsant", "quae", "quam", "quanto", "quarum", "quem", "qui", "quia", "quicquam", "quin", "quinta", "quisque", "quisquis", "quod", "quoque", "radiis", "rapidisque", "recens", "recepta", "recessit", "rectumque", "regat", "regio", "regna", "reparabat", "rerum", "retinebat", "ripis", "rudis", "sanctius", "sata", "satus", "scythiam", "secant", "secrevit", "sectamque", "secuit", "securae", "sed", "seductaque", "semina", "semine", "septemque", "sibi", "sic", "siccis", "sidera", "silvas", "sine", "sinistra", "sive", "sole", "solidumque", "solum", "sorbentur", "speciem", "spectent", "spisso", "sponte", "stagna", "sua", "subdita", "sublime", "subsidere", "sui", "suis", "summaque", "sunt", "super", "supplex", "surgere", "tanta", "tanto", "tegi", "tegit", "tellure", "tellus", "temperiemque", "tempora", "tenent", "tepescunt", "terra", "terrae", "terram", "terrarum", "terras", "terrenae", "terris", "timebat", "titan", "tollere", "tonitrua", "totidem", "totidemque", "toto", "tractu", "traxit", "triones", "tuba", "tum", "tumescere", "turba", "tuti", "ubi", "ulla", "ultima", "umentia", "umor", "unda", "undae", "undas", "undis", "uno", "unus", "usu", "ut", "utque", "utramque", "valles", "ventis", "ventos", "verba", "vesper", "videre", "vindice", "vis", "viseret", "vix", "volucres", "vos", "vultus", "zephyro", "zonae"];

/* Swedish words. These are all the words in the two first paragraphs of August Strindberg's R�da Rummet. */
var swedish = ["afton", "allm&auml;nheten", "allting", "arbetat", "att", "av", "bakom", "bar�ge-lappar", "berberisb&auml;r", "Bergsund", "bers&aring;er", "bestr&ouml;dd", "bj&ouml;do", "blev", "blivit", "blom", "blommor", "bofinkarne", "bon", "bort", "bos&auml;ttningsbekymmer", "branta", "bygga", "b&auml;nkfot", "b&aring;de", "b&ouml;rjade", "b&ouml;rjan", "b&ouml;rjat", "Danviken", "de", "del", "deltogo", "den", "det", "detsamma", "djur", "draga", "drog", "drogos", "d&auml;r", "d&auml;rf&ouml;r", "d&auml;rifr&aring;n", "d&auml;rinne", "d&aring;", "efter", "ej", "ekl&auml;rerade", "emot", "en", "ett", "fjol&aring;rets", "fjor", "fj&auml;rran", "for", "fortsatte", "fram", "friska", "fr&aring;n", "f&auml;rd", "f&auml;stningen", "f&aring;", "f&ouml;nstervadden", "f&ouml;nstren", "f&ouml;r", "f&ouml;rbi", "f&ouml;rdes", "f&ouml;rf&auml;rligt", "f&ouml;rut", "genom", "gick", "gingo", "gjorde", "granris", "gren", "gripa", "gr&aring;sparvarne", "g&aring;", "g&aring;ngarne", "g&aring;tt", "g&ouml;mde", "hade", "halmen", "havet", "hela", "hittade", "hon", "hundar", "hus", "H&auml;stholmen", "h&aring;rtappar", "h&ouml;llo", "h&ouml;stfyrverkeriet", "i", "icke", "igen", "ilade", "illuminerade", "in", "ingen", "innanf&ouml;nstren", "Josefinadagen", "just", "kastade", "kiv", "klistringen", "kl&auml;ttrade", "knoppar", "kol", "kom", "korset", "korta", "kunde", "kvastar", "k&auml;nde", "k&auml;rleksfilter", "k&ouml;ksan", "lavkl&auml;dda", "lekte", "levdes", "Liding&ouml;skogarne", "ligger", "Liljeholmen", "lilla", "lindarne", "liv", "luften", "lukten", "l&auml;mna", "l&aring;ngt", "l&ouml;vsamlingar", "maj", "med", "medan", "mellan", "men", "moln", "Mosebacke", "mot", "m&auml;nskofot", "navigationsskolans", "nu", "n&auml;san", "obesv&auml;rat", "obrustna", "och", "ofruktsamt", "om", "os", "paljetter", "passade", "piga", "plats", "plockade", "p&auml;rontr&auml;d", "p&aring;", "rabatterna", "rakethylsor", "Riddarfj&auml;rden", "Riddarholmskyrkan", "ringdans", "rivit", "Rosendal", "rosenf&auml;rgat", "rusade", "r&ouml;karne", "saffransblommorna", "samla", "samma", "sandg&aring;ngarne", "sedan", "sig", "Sikla&ouml;n", "sin", "sina", "sista", "Sj&ouml;tullen", "Sj&ouml;tulln", "Skeppsbrob&aring;tarne", "skolan", "skr&auml;md", "skr&auml;p", "skydd", "sk&ouml;t", "slagits", "slog", "sluppit", "sluta", "snart", "sn&ouml;", "sn&ouml;dropparne", "solen", "som", "sommarn&ouml;jena", "spillror", "Stadsg&aring;rden", "stam", "stekflott", "stickorna", "stod", "stor", "stora", "stranden", "str&aring;lar", "st&ouml;rtade", "sydlig", "syrenerna", "s&aring;go", "s&aring;gsp&aring;n", "s&aring;lunda", "s&ouml;dra", "tagit", "tak", "takpannorna", "till", "tillbaka", "tittade", "tj&auml;ra", "tonade", "trampat", "tran", "tr&auml;d", "tr&auml;dg&aring;rden", "Tyskans", "t&ouml;rnade", "t&ouml;rnrosblad", "undanr&ouml;jda", "under", "unga", "upp", "uppf&ouml;r", "uppgr&auml;vda", "ur", "ut", "utefter", "utmed", "var", "Vaxholm", "verksamhet", "vilka", "vilken", "vimplarne", "vind", "vinden", "vinterns", "voro", "v&auml;gg", "v&auml;ggen", "v&auml;ntade", "&auml;nnu", "&aring;ret", "&aring;t", "&ouml;lskv&auml;ttar", "&ouml;mt&aring;ligare", "&ouml;ppnad", "&ouml;ppnades", "&ouml;ster", "&ouml;ver"];

// just switch language like this! You can also do this in a script block on the page. 
var loremLang = latin;

/* Characters to end a sentence with. Repeat for frequencies (i.e. most sentences end in a period) */
var endings = "................................??!";

/* randomly returns true with a certain chance (a percentage) */
function chance(percentage){
	return (Math.floor(Math.random() * 100) < percentage);
}

/* capitalizes a word */
function capitalize(aString){
	return aString.substring(0,1).toUpperCase() + aString.substring(1, aString.length);
}

/* returns a random lorem word */
function getLoremWord(){
	return loremLang[Math.floor(Math.random()*loremLang.length)];
}

function getLoremEnding(){
	var i = Math.floor(Math.random()*endings.length);
	return endings.substring(i, i+1);
}

/* inserts a number of lorem words. Does not append a space at the end. */
function loremIpsum(numWords){
    var string = "";
	for(var i=0; i<numWords-1; i++){
        string += getLoremWord() + " ";
	}
    string += getLoremWord();

    return string;
}

/* inserts a sentence of random words. Appends a space at the end. */
function loremIpsumSentence(numWords){
    var string = "";
    string += capitalize(getLoremWord()) + " ";
	string += loremIpsum(numWords-1);
    string += getLoremEnding();
    string += " ";

    return string;
}

/* inserts a sentence of random words, sometimes with extra punctuation. Appends a space at the end. */
function loremIpsumSentence2(numWords){
    var string = "";
    string += capitalize(getLoremWord()) + " ";
	var part1 = 0;
	if(chance(50)){
		part1 = Math.floor(Math.random() * numWords-2);
		string += loremIpsum(part1);
        string += ", ";
	} else {
        string += " ";
	}
	loremIpsum(numWords - part1 - 1);
    string += getLoremEnding();
    string += " ";

    return string;
}

/* inserts a paragraph of sentences of random words. */
function loremIpsumParagraph(numWords){
	var words = numWords;
    var ipsum = "";
	while(words > 0){
		if(words > 10){
			var w = Math.floor(Math.random() * 8) + 2;
			ipsum = loremIpsumSentence2(w);
			words = words - w;
		} else {
			ipsum = loremIpsumSentence2(words);
			words = 0;
		}
	}

    return ipsum;
}


/**
 * Article generation by James Hines
 ***/
function rand(max, min)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomArticles(total, save){
    save = save || false;
    var articles = [];
    var article = {};
    var content = "", description = "", title = "";
    var images = [];
    var abstractImage;

    for(var i = 1; i <= total; i++){
        title = generateTitle();
        content = generateContent();
        description = generateDescription(content);
        images = generateImages();
        abstractImage = getAbstractImage(images);

        article = {
            "id": i,
            "title": title,
            "content": content,
            "date": generateDate(),
            "description": description,
            "likes": Math.floor(Math.random() * 100),
            "images": images,
            "abstractImage": abstractImage,
            "abstractImageOrientation": abstractImageOrientation(abstractImage),
            "preferredArea": preferredArea(title, description, abstractImage),
            "url": "http://example.com",
            "score": 0,
            "views": Math.floor(Math.random() * 200)
        }

        article.layout = article.preferredArea.toString();

        if(article.preferredArea == 3){
            article.layout = "2"; // one cols two rows
        }

        if(article.preferredArea == 2){
            article.layout = "8"; // one cols two rows
        }

        var data = {
            article: article
        };

        // persist each article
        if(save) {
            save(data);
        }

        articles.push(article);
    }

    return articles;
}

function generateTitle(){
    var title = "";
    var min = 5, max = 20;
    var numWords = rand(max, min);
    title = toTitleCase(loremIpsumSentence(numWords));

    return title;
}

function getAbstractImage(images){
    if(images.length > 0){
        var largestImage = {};
        var largestImageArea = 0, imageArea = 0;

        // we'll use the image with the largest area as the abstract image
        for(var i = 0; i < images.length; i++){
            imageArea = images[i].w * images[i].h;

            if(imageArea > largestImageArea){
                largestImageArea = imageArea;
                largestImage = {
                    "src": images[i].src,
                    "w": images[i].w,
                    "h": images[i].h
                };
            }
        }

        return largestImage;
    }else{
        return {}
    }
}

function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function generateContent(){
    var content = "";
    var min = 100, max = 300;
    var numWords = rand(max, min);
    content = loremIpsumSentence(numWords);

    return content;
}

function generateDate(){
    var MILISECONDS_IN_HOURS = 3600000;
    var d = Date.now() - (rand(1, 12) * MILISECONDS_IN_HOURS);
    return standardizedNow(new Date(d));
}

function generateDescription(content){
    var description = "";
    var min = 10, max = content.split(" ").length - 100;
    description = content.split(" ").splice(0, rand(max, min)).join(" ");

    return description;
}

function generateImages(){
    var numImages = Math.floor(Math.random() * 5);
    var images = [];
    var image = {};
    var width = 0, height = 0;

    if(numImages == 0){
        return images;
    }else{
        for(var i = 1; i <= numImages; i++){
            var min = 50, max = 600;
            width = rand(max, min);
            height = rand(max, min);

            image = {
                "src": "http://placehold.it/" + width + "x" + height,
                "w": width,
                "h": height
            }
            images.push(image);
        }

        return images;
    }
}

function abstractImageOrientation(image){
    // perfectly square = 1
    // landscape > 1
    // highly landscape > 1.3
    // portrait < 1
    // highly portrait < 0.5

    if(image.w / image.h > 1){
        return "landscape";
    }

    if(image.w / image.h == 1){
        return "square";
    }

    if(image.w / image.h < 1){
        return "portrait";
    }
}


function preferredArea(title, description, image){
    // area represents the square area of space an article occupies in the layout
    // values can be 1, 2, 3, 4
    var area = 1; // start with an area of 1
    var orientation = abstractImageOrientation(image);

    // will this article fit into a 1 x 1?
    // it will if it only has a title
    if(Object.keys(image).length == 0 && description === ""){
        return area;
    }

    // will this article fit into a 1 x 1?
    // it will if it has short description and no image for the abstract
    if(Object.keys(image).length == 0 && description.split(" ").length <= 40){
        return area;
    }

    // will this article fit into a 1 x 1?
    // it will if it has a short description and non-portrait image for the abstract
    if(Object.keys(image).length > 0
        && (description.split(" ").length > 0
        && description.split(" ").length <= 30)
        && orientation == "landscape"){
        return area; // preferred  area of 1
    }

    // will this article fit into a 2 x 1?
    // it will if it has long description and a landscape image for the abstract
    if(Object.keys(image).length > 0
        && description.split(" ").length >= 60
        && orientation == "landscape"){
        return area += 1; // preferred  area of 2
    }

    // will this article fit into a 2 x 1?
    // it will if it has mid length description and an image for the abstract
    // with a portrait orientation
    if(Object.keys(image).length > 0
        && description.split(" ").length > 20
        && orientation == "portrait"){
        return area += 1; // preferred  area of 2
    }

    // will this article fit into a 2 x 1?
    // it will if it has a mid length description and no image for the abstract
    if(Object.keys(image).length == 0
        && (description.split(" ").length > 40
        && description.split(" ").length <= 80)){
        return area += 1; // preferred  area of 2
    }

    // will this article fit into a 1 x 2?
    // it will if it has a description and non-portrait image for the abstract
    if(Object.keys(image).length > 0
        && (description.split(" ").length > 60
        && description.split(" ").length <= 80)
        && orientation == "landscape"){
        return area += 2; // preferred  area of 3
    }

    // will this article fit into a 3 x 1?
    // it will if it has a long description and no image for the abstract
    if(Object.keys(image).length == 0 && description.split(" ").length > 120){
        return area += 3; // preferred  area of 4
    }

    // will this article fit into a 3 x 1?
    // it will if it has a long description and smaller image for the abstract
    if(Object.keys(image).length > 0 && description.split(" ").length > 80 && image.w <= 300){
        return area += 3; // preferred  area of 4
    }

    // will this article fit into a 2 x 2?
    // it will if it has a long description and a larger image for the abstract
    if(Object.keys(image).length > 0 && description.split(" ").length > 80 && image.w > 300){
        return area += 4; // preferred  area of 5
    }

    return area;
}

/**
 *  Returns time stamp as a string YYYY-mm-ddTHH:mm:ssZ
 */
function standardizedNow(d) {
    if (!d) d = new Date();
    return dateToISO8601(d, '-', ':');
}

/**
 * Convert a JS date object to an ISO8601 string representation. Optional separator characters
 * for date and time can be supplied. Default values for separators are provided.
 *
 * @param {Date} d A JS date object to format
 * @param {String} dateSep Separator for date terms. Default is '-'.
 * @param {String} timeSep Separator for time terms. Default is ':'.
 * @return {String} The ISO8601 formatted date and time value.
 */
function dateToISO8601(d, dateSep, timeSep) {
    function pad(n) {
        return n < 10 ? '0' + n : n
    }

    if (typeof dateSep !== 'string') dateSep = '-';
    if (typeof timeSep !== 'string') timeSep = ':';

    return d.getUTCFullYear() + dateSep
        + pad(d.getUTCMonth() + 1) + dateSep
        + pad(d.getUTCDate()) + 'T'
        + pad(d.getUTCHours()) + timeSep
        + pad(d.getUTCMinutes()) + timeSep
        + pad(d.getUTCSeconds());
}