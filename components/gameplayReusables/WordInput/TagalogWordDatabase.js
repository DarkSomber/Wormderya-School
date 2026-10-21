/**
 * Word list of formal Tagalog/Filipino vocabulary: no slang, no
 * texting shorthand, no informal spellings. WordValidator only needs
 * something that exposes `has(word)`, so swap or extend it freely.
 *
 * Rules every entry follows (so a word is actually buildable):
 *   - Only letters from DEFAULT_LETTER_POOL (A,B,K,D,E,G,H,I,L,M,N,O,P,R,S,T,U,W,Y).
 *     "NG" is just N + G, so words like NGIPIN and NGAYON are fine.
 *   - 3 to 6 letters. The input row has DEFAULT_INPUT_BOX_COUNT (5) or the
 *     level's inputBoxCount (6) boxes, so anything longer can never be typed.
 *   - Root words and common everyday vocabulary, mostly native Tagalog.
 *
 * The first block is the original test list; the rest is grouped by topic.
 */
export const TAGALOG_WORD_LIST = [
  'AKO',     // I
  'IKAW',    // you
  'TAYO',    // we (inclusive)
  'KAMI',    // we (exclusive)
  'BAHAY',   // house
  'TUBIG',   // water
  'ARAW',    // sun / day
  'GABI',    // night
  'BATA',    // child
  'TAO',     // person
  'MATA',    // eye
  'PUSO',    // heart
  'ISDA',    // fish
  'BATO',    // rock / stone
  'DAGAT',   // sea
  'BUNDOK',  // mountain
  'KAIN',    // eat
  'LAKAD',   // walk
  'BUHAY',   // life / alive
  'LUPA',    // earth / land
  'HANGIN',  // wind
  'APOY',    // fire
  'AKALA',   // belief / assumption
  'BAGAY',   // thing / object
  'BALIK',   // return
  'BAWAT',   // each / every
  'GABAY',   // guide
  'GANDA',   // beauty
  'KAMAY',   // hand
  'PILIT',   // forced / insistence
  'SULAT',   // letter / writing
  'TAWAG',   // call
  'YAMAN',   // rich
  'SIRA',    // broken
  'PILA',    // line of peopel
  'PINOY',   // MALE PILIPINO
  'LOBO',    // WOLF
  'BOLO',    // WEAPON
  'PINAY',   // FEMALE PILIPINO
  'TAE',     // POO
  'TABO',    // DIPPER
  'SOPAS',   // FOOD sopas
  'TOYO',    // SOY SAUCE
  'TUYO',    // DRY
  'GAMIT',   // ITEM
  'DAAN',    // ROAD / WAY
  'ARAW',    // SUN
  'PLATO',   // PLATE
  'LABA',    // WASHING CLOTHES
  'LASA',    // TASTE
  'MALASA',  // TASTY
  'BARA',    // STUCK
  'KUMOT',   // Blanket
  'KAPE',    // Coffee
  'LAMAN',   // meat
  'DAPA',    // Knell
  'GATA',    // coconot milk
  'PAAWA',   // sulky(?)
  'AWA',     // Mercy
  'KUTO',    // Lice
  'HAWA',    // Infect
  'BAON',    // allowance or food something bruh
  'KAAWAY',  // Enemy
  'TAGA',    // Stab
  'PASO',    // Burn or Pot
  'RUTA',    // Route
  'POGI',    // Handsome
  'MALAY',   // conscious
  'GULO',    // messy
  'ANGULO',  // angle (?)
  'GULONG',  //  
  'MUTYA',   // Jewel
  'TIGAS',   // Hard
  'MALAS',   // 
  'DAGA',    // Rat
  'PAYO',    // 
  'MULTO',   // Ghost
  'REGLA',   // period for gorl
  'MAASIM',  //
  'MABAHO',  // Smelly
  'MAALAT',  // Salty
  'PAASA',   // Led on
  'ASA',     // hope
  'AGAP',    //
  'AGA',     // 
  'SUGAL',   // 
  'PINSAN',  //
  'LATA',    //
  'TONO',    //
  'MANO',    //
  'MUNDO',   //
  'BUWAYA',  //
  'KURAKOT', //
  'PAYAT',   //
  'MALABO',  //
  'MALINAW', //
  'HAPON',   //
  'SUBO',    //
  'KUPAL',   //
  'DABOG',   //
  'SAPOL',   //
  'DOBLE',   // two
  'HARANA',  //
  'SALUDO',  //
  'TAON',    //
  'PASKO',   //
  'HUWAG',   //
  'PUNO',    //
  'PONO',    //
  'HUBAD',   //
  'HABAGAT', //
  'AWAT',    //
  'ATA',     //
  'LAYO',    
  'KASAL',
  'DASAL',
  'IMPYERNO', 
  'LANGIT',
  'DUWAG',
  'BOTA',
  'SAKSAK',
  'PESTE',
  'TALO',
  'LAMBING',
  'DUDA',
  'DULOT',
  'SALAPI',
  'SAPAGKAT',
  'ARAY',
  'BAGAY',
  'LABIS',
  'ALAT',     // salty variant
  'ULAT', 
  'KABAYO',
  'TUHOD',
  'GUSTO',    //
  'NOO',      // forehead
  'HAROT',    // mischevous
  'MAPA',     //
  'GAYA',     // 
  'BALA',     //
  'ANAY',     //
  'KADAMAY',  //
  'DAKIP',    //
  
  


  // --- Pronouns and pointing words ---
  'SILA',     // they
  'KAYO',     // you (plural)
  'SIYA',     // he / she
  'AMIN',     // our (exclusive)
  'ATIN',     // our (inclusive)
  'INYO',     // your (plural)
  'ITO',      // this
  'IYON',     // that (far)
  'IYAN',     // that (near you)
  'DITO',     // here
  'DOON',     // there

  // --- Question words ---
  'SAAN',     // where
  'ANO',      // what
  'SINO',     // who
  'KAILAN',   // when
  'BAKIT',    // why
  'PAANO',    // how
  'ALIN',     // which
  'GAANO',    // how much / how
  'KASO',

  'ABANG',    // wait / watch out / stay on guard
  'ABOT',     // reach / hand over
  'AGAW',     // snatch / grab
  'AGAP',     // promptness / quickness
  'ALAB',     // blaze / passion
  'ALABOK',   // dust
  'ALALAH',   // (skip - bad spelling)
  'ALANGAN',  // uncertain / hesitant
  'ALIN',     // which
  'ALIS',     // leave / depart
  'AMOY',     // smell / odor
  'ANGAT',    // lifted / superior
  'ANGKIN',   // claim / inherent property
  'ANI',      // harvest
  'ANINO',    // shadow
  'ANTAY',    // wait
  'APAW',     // overflow
  'API',      // oppressed / maltreated
  'APOG',     // lime / chalk
  'ARUGA',    // tender care
  'ASAP',     // smoke / vapor
  'ASING',    // (skip)
  'ATAS',     // order / decree
  'AYOS',     // order / arrangement
  'BAKAS',    // trace / mark
  'BAKOD',    // fence
  'BALA',     // bullet / warning
  'BALI',     // fracture / broken
  'BALOT',    // wrap / cover
  'BANAL',    // holy / sacred
  'BANTA',    // threat / warning
  'BANTAY',   // guard / watcher
  'BANTOG',   // famous / renowned
  'BARO',     // clothes / dress
  'BASAG',    // broken / shattered
  'BASBAS',   // blessing
  'BATI',     // greet / beat (egg)
  'BATOC',    // nape
  'BAWAT',    // each / every
  'BIGKAS',   // pronounce / recite
  'BIGKIS',   // tie / bind together
  'BIGLA',    // sudden
  'BINGI',    // deaf
  'BIPOL',    // (skip)
  'BIPOLAR',  // (too long)
  'BITAW',    // let go / release
  'BITIN',    // hanging short
  'BITAG',    // trap / snare
  'BUBUK',    // weevil (BUBOK)
  'BUBOK',    // wood-borer / weevil
  'BUBUAN',   // (too long)
  'BUBOG',    // glass shard
  'BUBUOT',   // (skip)
  'BUKAS',    // open / tomorrow
  'BUKID',    // farm / field
  'BULAG',    // blind
  'BULAK',    // cotton
  'BUNOT',    // coconut husk / pull out
  'BUNYAG',   // reveal / disclose
  'DALI',     // quickness / instant
  'DALANG',   // rare / infrequent
  'DAMDAM',   // emotion / feeling
  'DAMOH',    // (skip)
  'DANAS',    // experience
  'DANGAL',   // honor / dignity
  'DAPAT',    // must / proper
  'DILG',     // (skip - acronym)
  'DIKIT',    // stick / paste / close
  'DIPA',     // fathom / arm span
  'DIWATA',   // fairy / nymph
  'DUKHA',    // poor / destitute
  'DULOS',    // trowel / weed cutter
  'DURAN',    // spittoon
  'GAOD',     // row / oar
  'GAPANG',   // crawl
  'GAPOS',    // tied up / bound
  'GATAS',    // milk
  'GAYAK',    // attire / decoration
  'GITING',   // heroism / valor
  'GUHIT',    // line / draw
  'GULANG',   // age / maturity
  'GUTOM',    // hunger
  'HAGIS',    // throw
  'HALA',     // warning / go ahead
  'HALAL',    // elect / vote
  'HALIK',    // kiss
  'HALIP',    // instead
  'HAMAK',    // humble / lowly
  'HAMON',    // challenge
  'HANGAD',   // wish / desire
  'HAPIS',    // grief / sorrow
  'HATOL',    // sentence / judgment
  'HAWAK',    // hold / grasp
  'HAYAG',    // manifest / public
  'HILOM',    // healing
  'HINTO',    // stop / halt
  'HIPON',    // shrimp
  'HUKOM',    // judge
  'IBABAW',   // surface / top
  'IBAYO',    // across / double
  'IGTING',   // tension / intensity
  'ILAP',     // wildness / shyness
  'INAM',     // goodness
  'INAT',     // stretch
  'ISAGAD',   // push to limit
  'KABAN',    // trunk / chest
  'KAGAT',    // bite
  'KAPWA',    // fellow person
  'KILOS',    // movement / action
  'KINIS',    // smoothness
  'KIPOT',    // narrowness
  'KUBLI',    // hidden / shelter
  'KULOB',    // enclosed heat / sealed
  'KUPAS',    // faded
  'LAKAS',    // strength
  'LAKBAY',   // travel / trip
  'LAMAD',    // membrane
  'LANDAS',   // path / trail
  'LAPAD',    // width / wide
  'LAPIT',    // approach / near
  'LASAP',    // savor / taste
  'LAYAG',    // sail
  'LIGAYA',   // happiness / delight
  'LIKHA',    // create / artwork
  'LILOK',    // carve / sculpture
  'LINGAP',   // caring protection
  'LIPAD',    // fly
  'LIPON',    // group / gathering
  'LUBAY',    // loosen / relent
  'LUMBAY',   // sadness
  'LUNAS',    // remedy / cure
  'LUNOD',    // drown
  'LUTANG',   // float
  'MALAY',    // awareness
  'MANGHA',   // amazed
  'MASID',    // observe / watch
  'MAYARI',   // owner / master
  'MITHI',    // goal / earnest desire
  'MULAT',    // open eyes / aware
  'NILAY',    // reflect / contemplate
  'PAGOD',    // tired
  'PALAD',    // palm / fate
  'PANGO',    // flat-nosed
  'PANGIL',   // fang / tusk
  'PANTAY',   // level / equal
  'PARUSA',   // penalty / punishment
  'PATAK',    // drop of liquid
  'PATAY',    // dead
  'PAYAPA',   // peaceful
  'PILAY',    // lame / sprained
  'PINTIG',   // pulse / beat
  'PISIL',    // squeeze
  'PUPO',     // address respectfully
  'PUTOL',    // cut / severed
  'SABAY',    // together / simultaneous
  'SABIK',    // eager
  'SADYA',    // intentional
  'SAGIP',    // rescue
  'SAKIT',    // pain / sickness
  'SALAG',    // parry / block
  'SALOK',    // scoop up water
  'SAMPAL',   // slap
  'SANDAT',   // armed / full
  'SANGGA',   // block / guard
  'SAPA',     // creek / stream
  'SAPIT',    // arrival / reach
  'SAYAD',    // grounded / touching bottom
  'SAYSAY',   // meaning / worth
  'SIGAW',    // shout / scream
  'SIKAP',    // diligence / effort
  'SIKAT',    // rise (sun) / famous
  'SILAY',    // glance / peek
  'SIMOY',    // breeze
  'SINTA',    // beloved / love
  'SIPAG',    // hard work
  'SIPAT',    // aim / check alignment
  'SULYAP',   // quick glance
  'TALAS',    // sharpness
  'TALI',     // rope / string
  'TAMPO',    // sulk / hurt feelings
  'TAROK',    // comprehend / measure depth
  'TAYOG',    // height / altitude
  'TIGIL',    // stop
  'TINIG',    // voice
  'TIPON',    // gather
  'TISOD',    // stumble
  'TUKO',     // gecko
  'TURING',   // regard / treat
  'TUSOK',    // prick / pierce
  'TUWIN',    // every time
  'UDYOK',    // urge / prompt
  'UGONG',    // reverberation / hum
  'ULIT',     // repeat
  'UNAW',     // understand (mula sa unawa)
  'UNOS',     // storm / tempest
  'USAP',     // conversation
  'UYAM',     // sarcasm / mock
  'WAKAS',    // end / conclusion
  'WALAT',    // destroyed
  'WANGIS',   // likeness / resemblance
  'WASAK',    // ruined / smashed
  'WASTO',    // correct / right
  'YAKAP',    // embrace / hug
  'YANGYANG', // dry in the air
  'YUKO',      // bow / bend head
  'DAYA',
  'PANA', 
  'DATI',
  'PAYO',

  // --- Connectors and everyday particles ---
  'ANG',      // the (marker)
  'MGA',      // plural marker
  'HINDI',    // no / not
  'OPO',      // yes (polite)
  'WALA',     // none / without
  'NAMAN',    // also / on the other hand
  'LAMANG',   // only / just
  'KUNG',     // if
  'DAHIL',    // because
  'NGUNIT',   // but
  'KAPAG',    // when / whenever
  'HABANG',   // while
  'MULA',     // from
  'PARA',     // for
  'BAGO',     // before / new

  // --- Family and people ---
  'INA',      // mother
  'NANAY',
  'MAMA',     // stranger
  'AMA',      // father
  'ATE',      // older sister
  'KUYA',     // older brother
  'LOLA',     // grandmother
  'LOLO',     // grandfather
  'ANAK',     // child (offspring)
  'ASAWA',    // spouse
  'GURO',     // teacher
  'HARI',     // king
  'BINATA',   // young man
  'DALAGA',   // young woman
  'LALAKI',   // man / male
  'BABAE',    // woman / female
  'BAYANI',   // hero

  // --- Places ---
  'BAYAN',    // town / nation
  'NAYON',    // village
  'DAAN',     // road / path
  'LIKOD',    // back (behind)
  'LOOB',     // inside
  'LABAS',    // outside
  'ILOG',     // river
  'LAWA',     // lake
  'GUBAT',    // forest
  'BUKID',    // field / farm
  'PULO',     // island
  'ISLA',     // island
  'BUROL',    // hill
  'LAMBAK',   // valley
  'BAYBAY',   // shore
  'BANSA',    // nation
  'SILID',    // room
  'PINTO',    // door
  'SAHIG',    // floor
  'BUBONG',   // roof
  'TULAY',    // bridge

  // --- Food and farm ---
  'PALAY',    // unhusked rice
  'BIGAS',    // uncooked rice
  'KANIN',    // cooked rice
  'ULAM',     // viand / dish
  'INUMIN',   // drink
  'GATAS',    // milk
  'ITLOG',    // egg
  'SAGING',   // banana
  'NIYOG',    // coconut
  'BUKO',     // young coconut
  'LUYA',     // ginger
  'BAWANG',   // garlic
  'ASIN',     // salt
  'SUKA',     // vinegar
  'LANGIS',   // oil

  // --- Animals and plants ---
  'MANOK',    // chicken
  'BABOY',    // pig
  'BAKA',     // cow
  'ASO',      // dog
  'PUSA',     // cat
  'IBON',     // bird
  'HIPON',    // shrimp
  'PAGONG',   // turtle
  'BUWAYA',   // crocodile
  'HAYOP',    // animal
  'DAHON',    // leaf
  'UGAT',     // root
  'BUNGA',    // fruit
  'PUNO',     // tree / full

  // --- Nature and weather ---
  'ULAN',     // rain
  'BAGYO',    // typhoon
  'KIDLAT',   // lightning
  'KULOG',    // thunder
  'ULAP',     // cloud
  'LANGIT',   // sky
  'BITUIN',   // star
  'BUWAN',    // moon / month
  'ILAW',     // light / lamp225
  'DILIM',    // darkness
  'INIT',     // heat
  'LAMIG',    // cold

  // --- Body ---
  'ULO',      // head
  'BUHOK',    // hair
  'MUKHA',    // face
  'NGIPIN',   // teeth
  'DILA',     // tongue
  'LABI',     // lip
  'TENGA',    // ear
  'ILONG',    // nose
  'PAA',      // foot
  'TIYAN',    // stomach
  'DUGO',     // blood
  'BUTO',     // bone
  'BALAT',    // skin
  'DALIRI',   // finger
  'DIBDIB',   // chest
  'LEEG',     // neck

  // --- Things around the house ---
  'KAMA',     // bed
  'UNAN',     // pillow
  'BASO',     // drinking glass
  'KAWALI',   // wok / pan
  'AKLAT',    // book
  'PAHINA',   // page
  'DAMIT',    // clothes
  'BARO',     // shirt / dress
  'SUOT',     // wear / worn
  'SUKLAY',   // comb
  'SUSI',     // key
  'BANGKA',   // small boat

  // --- Money and materials ---
  'SALAPI',   // money
  'PILAK',    // silver
  'GINTO',    // gold
  'BAKAL',    // iron / steel
  'TANSO',    // copper
  'KAHOY',    // wood

  // --- Actions ---
  'INOM',     // drink (verb)
  'TULOG',    // sleep
  'GISING',   // wake up
  'TAKBO',    // run
  'LUNDAG',   // jump
  'UPO',      // sit
  'TINGIN',   // look
  'DINIG',    // hear
  'SALITA',   // word / speak
  'BASA',     // read
  'ARAL',     // study
  'TURO',     // teach
  'ISIP',     // think / mind
  'ALAM',     // know
  'MAHAL',    // love / expensive
  'IBIG',     // love / like
  'NAIS',     // want
  'HANAP',    // search
  'HINTAY',   // wait
  'SAGOT',    // answer
  'TANONG',   // question
  'TULONG',   // help
  'BIGAY',    // give
  'KUHA',     // take
  'BILI',     // buy
  'BAYAD',    // pay
  'LUTO',     // cook
  'LINIS',    // clean
  'HUGAS',    // wash
  'PALIT',    // exchange / change
  'BUKAS',    // open / tomorrow
  'SARA',     // close
  'DALA',     // carry
  'HILA',     // pull
  'TULAK',    // push
  'HAWAK',    // hold
  'TAPON',    // throw away
  'LABAN',    // fight
  'SAMA',     // go along / together
  'LAGAY',    // put

  // --- Describing words ---
  'MALAKI',   // big
  'MALIIT',   // small
  'MABAIT',   // kind
  'MATAAS',   // tall / high
  'MABABA',   // low
  'MAINIT',   // hot
  'MADUMI',   // dirty
  'MADALI',   // easy
  'MASAYA',   // happy
  'LUMA',     // old / worn
  'MURA',     // cheap
  'TAMA',     // correct
  'MALI',     // wrong
  'TOTOO',    // true
  'TUNAY',    // real
  'BUO',      // whole
  'HATI',     // half / divided
  'DAMI',     // amount
  'KAUNTI',   // few
  'MARAMI',   // many
  'LAHAT',    // all
  'IBA',      // other

  // --- Feelings and qualities ---
  'GALIT',    // anger
  'TUWA',     // joy
  'TAKOT',    // fear
  'SAYA',     // joy
  'LAKAS',    // strength
  'HINA',     // weakness
  'TAAS',     // height
  'BABA',     // lowness
  'LAKI',     // size
  'LIIT',     // smallness
  'BAGAL',    // slowness
  'BILIS',    // speed
  'TAPAT',    // honest
  'TAPANG',   // courage
  'DANGAL',   // honor
  'GALANG',   // respect
  'DIWA',     // spirit / mind

  // --- Numbers ---
  'ISA',      // one
  'DALAWA',   // two
  'TATLO',    // three
  'APAT',     // four
  'LIMA',     // five
  'ANIM',     // six
  'PITO',     // seven
  'WALO',     // eight
  'SIYAM',    // nine
  'SAMPU',    // ten
  'LIBO',     // thousand

  // --- Time ---
  'UMAGA',    // morning
  'HAPON',    // afternoon
  'NGAYON',   // now / today
  'MAMAYA',   // later
  'NOON',     // then / back then
  'MINSAN',   // once / sometimes
  'PALAGI',   // always
  'TAON',     // year
  'LINGGO',   // week

  // --- Directions ---
  'KANAN',    // right
  'KALIWA',   // left
  'HARAP',    // front
  'ILALIM',   // under
  'HILAGA',   // north
  'TIMOG',    // south
  'GITNA',    // middle
  'GILID',    // side

  // --- Colors ---
  'PULA',     // red
  'DILAW',    // yellow
  'PUTI',     // white
  'ITIM',     // black
  'KULAY',    // color

  // --- Language, culture and ideas ---
  'WIKA',     // language
  'HIMIG',    // melody
  'AWIT',     // song
  'SAYAW',    // dance
  'LARO',     // game / play
  'HANGAD',   // aspiration
  'ALAGA',    // care
  'ALAALA',   // memory
  'LIHAM',    // letter
  'BALITA',   // news
  'TULA',     // poem
  'TANDA',    // remember / sign
];

export const TAGALOG_WORD_DATABASE = new Set(
  TAGALOG_WORD_LIST.map((w) => w.toUpperCase())
);