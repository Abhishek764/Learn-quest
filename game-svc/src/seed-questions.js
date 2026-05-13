// Expanded question bank — 100 additional questions with knowledge graph concept tags
module.exports = [
  // ── MATH: Arithmetic ──
  {id:'q21',subject:'math',difficulty:0.15,content:'What is 7 + 8?',options:['13','14','15','16'],correct:2,explanation:'7+8=15',concepts:['math-arithmetic']},
  {id:'q22',subject:'math',difficulty:0.15,content:'What is 20 - 13?',options:['5','6','7','8'],correct:2,explanation:'20-13=7',concepts:['math-arithmetic']},
  {id:'q23',subject:'math',difficulty:0.2,content:'What is 9 × 7?',options:['56','63','72','81'],correct:1,explanation:'9×7=63',concepts:['math-arithmetic']},
  {id:'q24',subject:'math',difficulty:0.2,content:'What is 48 ÷ 6?',options:['6','7','8','9'],correct:2,explanation:'48÷6=8',concepts:['math-arithmetic']},
  {id:'q25',subject:'math',difficulty:0.25,content:'What is 125 + 376?',options:['491','501','511','401'],correct:1,explanation:'125+376=501',concepts:['math-arithmetic']},
  // ── MATH: Variables ──
  {id:'q26',subject:'math',difficulty:0.3,content:'If x = 5, what is 3x?',options:['8','10','15','20'],correct:2,explanation:'3×5=15',concepts:['math-variables']},
  {id:'q27',subject:'math',difficulty:0.3,content:'What is the value of y if y + 7 = 12?',options:['3','4','5','6'],correct:2,explanation:'y=12-7=5',concepts:['math-variables']},
  {id:'q28',subject:'math',difficulty:0.35,content:'Simplify: 4a + 3a',options:['7a','12a','7a²','a7'],correct:0,explanation:'4a+3a=7a',concepts:['math-variables']},
  // ── MATH: Fractions ──
  {id:'q29',subject:'math',difficulty:0.3,content:'What is 1/2 + 1/4?',options:['2/6','1/6','3/4','2/4'],correct:2,explanation:'2/4+1/4=3/4',concepts:['math-fractions']},
  {id:'q30',subject:'math',difficulty:0.3,content:'Which fraction is larger: 2/3 or 3/5?',options:['2/3','3/5','They are equal','Cannot tell'],correct:0,explanation:'2/3≈0.67>3/5=0.6',concepts:['math-fractions']},
  {id:'q31',subject:'math',difficulty:0.35,content:'What is 3/4 × 2/3?',options:['6/12','1/2','5/7','6/7'],correct:1,explanation:'(3×2)/(4×3)=6/12=1/2',concepts:['math-fractions']},
  // ── MATH: Decimals ──
  {id:'q32',subject:'math',difficulty:0.3,content:'What is 0.5 + 0.25?',options:['0.30','0.70','0.75','1.00'],correct:2,explanation:'0.5+0.25=0.75',concepts:['math-decimals']},
  {id:'q33',subject:'math',difficulty:0.35,content:'Convert 3/8 to a decimal.',options:['0.25','0.375','0.38','0.33'],correct:1,explanation:'3÷8=0.375',concepts:['math-decimals']},
  // ── MATH: Linear Equations ──
  {id:'q34',subject:'math',difficulty:0.45,content:'Solve: 3x - 5 = 10',options:['3','4','5','6'],correct:2,explanation:'3x=15,x=5',concepts:['math-linear-eq']},
  {id:'q35',subject:'math',difficulty:0.5,content:'Solve: 5x + 2 = 3x + 10',options:['2','3','4','5'],correct:2,explanation:'2x=8,x=4',concepts:['math-linear-eq']},
  {id:'q36',subject:'math',difficulty:0.5,content:'If 2(x+3)=14, what is x?',options:['3','4','5','6'],correct:1,explanation:'2x+6=14,2x=8,x=4',concepts:['math-linear-eq']},
  // ── MATH: Percentages ──
  {id:'q37',subject:'math',difficulty:0.4,content:'What is 25% of 80?',options:['15','20','25','30'],correct:1,explanation:'80×0.25=20',concepts:['math-percentages']},
  {id:'q38',subject:'math',difficulty:0.45,content:'A shirt costs $40. With 20% off, what do you pay?',options:['$28','$30','$32','$36'],correct:2,explanation:'40-(40×0.2)=32',concepts:['math-percentages']},
  {id:'q39',subject:'math',difficulty:0.5,content:'30 is what percent of 150?',options:['15%','20%','25%','30%'],correct:1,explanation:'30/150=0.2=20%',concepts:['math-percentages']},
  // ── MATH: Geometry ──
  {id:'q40',subject:'math',difficulty:0.3,content:'How many sides does a hexagon have?',options:['5','6','7','8'],correct:1,explanation:'A hexagon has 6 sides',concepts:['math-geometry-basics']},
  {id:'q41',subject:'math',difficulty:0.45,content:'What is the area of a rectangle 8m × 5m?',options:['13m²','26m²','40m²','80m²'],correct:2,explanation:'A=l×w=8×5=40m²',concepts:['math-area-perimeter']},
  {id:'q42',subject:'math',difficulty:0.45,content:'What is the perimeter of a square with side 9cm?',options:['18cm','27cm','36cm','81cm'],correct:2,explanation:'P=4×9=36cm',concepts:['math-area-perimeter']},
  {id:'q43',subject:'math',difficulty:0.45,content:'What are the angles in an equilateral triangle?',options:['45°','60°','90°','120°'],correct:1,explanation:'180÷3=60° each',concepts:['math-angles']},
  // ── MATH: Exponents ──
  {id:'q44',subject:'math',difficulty:0.5,content:'What is 2⁵?',options:['10','16','32','64'],correct:2,explanation:'2×2×2×2×2=32',concepts:['math-exponents']},
  {id:'q45',subject:'math',difficulty:0.5,content:'Simplify: x³ × x²',options:['x⁵','x⁶','2x⁵','x¹'],correct:0,explanation:'Add exponents: 3+2=5',concepts:['math-exponents']},
  // ── MATH: Ratios ──
  {id:'q46',subject:'math',difficulty:0.5,content:'If the ratio of boys to girls is 3:5 and there are 15 boys, how many girls?',options:['20','25','30','35'],correct:1,explanation:'15/3=5,5×5=25',concepts:['math-ratios']},
  // ── MATH: Inequalities ──
  {id:'q47',subject:'math',difficulty:0.5,content:'Solve: 2x + 1 > 7',options:['x>2','x>3','x>4','x<3'],correct:1,explanation:'2x>6,x>3',concepts:['math-inequalities']},
  // ── MATH: Quadratic ──
  {id:'q48',subject:'math',difficulty:0.7,content:'Solve x² - 9 = 0',options:['x=3','x=-3','x=±3','x=9'],correct:2,explanation:'x²=9,x=±3',concepts:['math-quadratic']},
  {id:'q49',subject:'math',difficulty:0.7,content:'What are the factors of x² + 5x + 6?',options:['(x+1)(x+6)','(x+2)(x+3)','(x+3)(x+3)','(x+1)(x+5)'],correct:1,explanation:'2×3=6,2+3=5',concepts:['math-quadratic']},
  // ── MATH: Polynomials ──
  {id:'q50',subject:'math',difficulty:0.65,content:'What is the degree of 4x³ + 2x - 7?',options:['1','2','3','4'],correct:2,explanation:'Highest power is 3',concepts:['math-polynomials']},

  // ── SCIENCE: Scientific Method ──
  {id:'q51',subject:'science',difficulty:0.15,content:'What is the first step of the scientific method?',options:['Experiment','Hypothesis','Observation','Conclusion'],correct:2,explanation:'Observe first, then hypothesize',concepts:['sci-scientific-method']},
  {id:'q52',subject:'science',difficulty:0.2,content:'What is a hypothesis?',options:['A fact','A testable prediction','A conclusion','An observation'],correct:1,explanation:'A hypothesis is a testable prediction',concepts:['sci-scientific-method']},
  // ── SCIENCE: States of Matter ──
  {id:'q53',subject:'science',difficulty:0.2,content:'Which is NOT a state of matter?',options:['Solid','Liquid','Gas','Energy'],correct:3,explanation:'Energy is not a state of matter',concepts:['sci-matter']},
  {id:'q54',subject:'science',difficulty:0.25,content:'What happens to water at 100°C?',options:['Freezes','Melts','Boils','Condenses'],correct:2,explanation:'Water boils at 100°C',concepts:['sci-matter']},
  // ── SCIENCE: Cells ──
  {id:'q55',subject:'science',difficulty:0.3,content:'What protects a plant cell but not an animal cell?',options:['Nucleus','Cell membrane','Cell wall','Cytoplasm'],correct:2,explanation:'Plant cells have cell walls',concepts:['sci-cells']},
  {id:'q56',subject:'science',difficulty:0.35,content:'Where is DNA found in a cell?',options:['Cytoplasm','Cell membrane','Nucleus','Ribosome'],correct:2,explanation:'DNA is in the nucleus',concepts:['sci-cells']},
  // ── SCIENCE: Solar System ──
  {id:'q57',subject:'science',difficulty:0.2,content:'Which planet is known as the Red Planet?',options:['Jupiter','Mars','Venus','Saturn'],correct:1,explanation:'Mars appears red due to iron oxide',concepts:['sci-solar-system']},
  {id:'q58',subject:'science',difficulty:0.25,content:'How many planets are in our solar system?',options:['7','8','9','10'],correct:1,explanation:'8 planets (Pluto reclassified)',concepts:['sci-solar-system']},
  // ── SCIENCE: Elements ──
  {id:'q59',subject:'science',difficulty:0.4,content:'What is the chemical symbol for gold?',options:['Go','Gd','Au','Ag'],correct:2,explanation:'Au from Latin aurum',concepts:['sci-elements']},
  {id:'q60',subject:'science',difficulty:0.4,content:'How many elements are in the periodic table?',options:['108','118','128','98'],correct:1,explanation:'118 confirmed elements',concepts:['sci-elements']},
  // ── SCIENCE: Photosynthesis ──
  {id:'q61',subject:'science',difficulty:0.4,content:'What do plants produce during photosynthesis?',options:['Carbon dioxide','Oxygen and glucose','Nitrogen','Water only'],correct:1,explanation:'6CO2+6H2O→C6H12O6+6O2',concepts:['sci-photosynthesis']},
  {id:'q62',subject:'science',difficulty:0.4,content:'Where does photosynthesis occur in a plant?',options:['Roots','Stem','Chloroplasts in leaves','Flowers'],correct:2,explanation:'Chloroplasts contain chlorophyll',concepts:['sci-photosynthesis']},
  // ── SCIENCE: Human Body ──
  {id:'q63',subject:'science',difficulty:0.45,content:'What organ pumps blood through the body?',options:['Brain','Lungs','Heart','Liver'],correct:2,explanation:'The heart pumps blood',concepts:['sci-human-body']},
  {id:'q64',subject:'science',difficulty:0.45,content:'Which system fights infections?',options:['Nervous','Digestive','Immune','Skeletal'],correct:2,explanation:'The immune system fights pathogens',concepts:['sci-human-body']},
  // ── SCIENCE: Forces ──
  {id:'q65',subject:'science',difficulty:0.5,content:'What force pulls objects toward Earth?',options:['Friction','Magnetism','Gravity','Inertia'],correct:2,explanation:'Gravity pulls objects toward Earth',concepts:['sci-forces']},
  {id:'q66',subject:'science',difficulty:0.5,content:'What is Newton\'s first law about?',options:['Force=mass×acceleration','Inertia','Every action has reaction','Gravity'],correct:1,explanation:'Objects at rest stay at rest (inertia)',concepts:['sci-forces']},
  // ── SCIENCE: Energy ──
  {id:'q67',subject:'science',difficulty:0.45,content:'What type of energy does a moving car have?',options:['Potential','Kinetic','Chemical','Thermal'],correct:1,explanation:'Moving objects have kinetic energy',concepts:['sci-energy']},
  {id:'q68',subject:'science',difficulty:0.45,content:'Energy cannot be created or destroyed. This is the law of:',options:['Gravity','Thermodynamics','Motion','Conservation of energy'],correct:3,explanation:'Conservation of energy',concepts:['sci-energy']},
  // ── SCIENCE: Genetics ──
  {id:'q69',subject:'science',difficulty:0.6,content:'What molecule carries genetic information?',options:['RNA','Protein','DNA','ATP'],correct:2,explanation:'DNA carries genetic code',concepts:['sci-genetics']},
  {id:'q70',subject:'science',difficulty:0.6,content:'How many chromosomes do humans have?',options:['23','44','46','48'],correct:2,explanation:'23 pairs = 46 total',concepts:['sci-genetics']},
  // ── SCIENCE: Chemical Reactions ──
  {id:'q71',subject:'science',difficulty:0.55,content:'What does a catalyst do?',options:['Slows reaction','Speeds reaction without being consumed','Stops reaction','Creates energy'],correct:1,explanation:'Catalysts speed up reactions',concepts:['sci-chemical-react']},
  // ── SCIENCE: Electricity ──
  {id:'q72',subject:'science',difficulty:0.55,content:'What unit measures electric current?',options:['Volt','Watt','Ampere','Ohm'],correct:2,explanation:'Current measured in Amperes',concepts:['sci-electricity']},

  // ── ENGLISH: Parts of Speech ──
  {id:'q73',subject:'english',difficulty:0.15,content:'Which word is a verb?',options:['Beautiful','Run','Slowly','Chair'],correct:1,explanation:'Run is an action word (verb)',concepts:['eng-parts-of-speech']},
  {id:'q74',subject:'english',difficulty:0.2,content:'Which word is an adjective?',options:['Quickly','Jump','Tall','They'],correct:2,explanation:'Tall describes a noun',concepts:['eng-parts-of-speech']},
  // ── ENGLISH: Verbs & Tenses ──
  {id:'q75',subject:'english',difficulty:0.3,content:'What is the past tense of "go"?',options:['Goed','Gone','Went','Going'],correct:2,explanation:'Go→went (irregular)',concepts:['eng-verbs-tenses']},
  {id:'q76',subject:'english',difficulty:0.3,content:'Which sentence is in present continuous tense?',options:['I run','I ran','I am running','I will run'],correct:2,explanation:'am/is/are + verb-ing = present continuous',concepts:['eng-verbs-tenses']},
  {id:'q77',subject:'english',difficulty:0.35,content:'What is the past participle of "write"?',options:['Wrote','Written','Writed','Writing'],correct:1,explanation:'write→wrote→written',concepts:['eng-verbs-tenses']},
  // ── ENGLISH: Vocabulary ──
  {id:'q78',subject:'english',difficulty:0.3,content:'What does "benevolent" mean?',options:['Evil','Kind and generous','Smart','Angry'],correct:1,explanation:'Benevolent means kind/generous',concepts:['eng-vocabulary']},
  {id:'q79',subject:'english',difficulty:0.35,content:'What does "ubiquitous" mean?',options:['Rare','Everywhere','Dangerous','Beautiful'],correct:1,explanation:'Ubiquitous means present everywhere',concepts:['eng-vocabulary']},
  // ── ENGLISH: Sentence Structure ──
  {id:'q80',subject:'english',difficulty:0.4,content:'Which is a compound sentence?',options:['I ran.','I ran and she walked.','Running fast.','The big red dog.'],correct:1,explanation:'Two independent clauses joined by "and"',concepts:['eng-sentence-struct']},
  // ── ENGLISH: Spelling ──
  {id:'q81',subject:'english',difficulty:0.35,content:'Which is spelled correctly?',options:['Recieve','Receive','Receve','Receeve'],correct:1,explanation:'i before e except after c',concepts:['eng-spelling']},
  {id:'q82',subject:'english',difficulty:0.35,content:'Which is spelled correctly?',options:['Occassion','Ocassion','Occasion','Occation'],correct:2,explanation:'Occasion — double c, single s',concepts:['eng-spelling']},
  // ── ENGLISH: Synonyms & Antonyms ──
  {id:'q83',subject:'english',difficulty:0.35,content:'What is a synonym for "happy"?',options:['Sad','Joyful','Angry','Tired'],correct:1,explanation:'Joyful means the same as happy',concepts:['eng-synonyms-ant']},
  {id:'q84',subject:'english',difficulty:0.35,content:'What is the antonym of "ancient"?',options:['Old','Historic','Modern','Classic'],correct:2,explanation:'Modern is opposite of ancient',concepts:['eng-synonyms-ant']},
  // ── ENGLISH: Idioms ──
  {id:'q85',subject:'english',difficulty:0.55,content:'What does "break the ice" mean?',options:['Destroy something','Start a conversation','Feel cold','Break a rule'],correct:1,explanation:'To initiate social interaction',concepts:['eng-idioms']},
  {id:'q86',subject:'english',difficulty:0.55,content:'What does "a piece of cake" mean?',options:['Dessert','Very easy','Expensive','Delicious'],correct:1,explanation:'Something very easy to do',concepts:['eng-idioms']},
  // ── ENGLISH: Comprehension ──
  {id:'q87',subject:'english',difficulty:0.5,content:'What is the main idea of a paragraph?',options:['The first sentence','The topic sentence','Every detail','The last word'],correct:1,explanation:'The topic sentence states the main idea',concepts:['eng-comprehension']},

  // ── GENERAL: Geography ──
  {id:'q88',subject:'general',difficulty:0.2,content:'What is the largest continent?',options:['Africa','North America','Asia','Europe'],correct:2,explanation:'Asia is the largest continent',concepts:['gen-world-geography']},
  {id:'q89',subject:'general',difficulty:0.25,content:'What is the longest river in the world?',options:['Amazon','Nile','Mississippi','Yangtze'],correct:1,explanation:'The Nile is approximately 6,650 km',concepts:['gen-world-geography']},
  {id:'q90',subject:'general',difficulty:0.3,content:'Which country has the largest population?',options:['USA','India','China','Russia'],correct:1,explanation:'India surpassed China in 2023',concepts:['gen-world-geography']},
  // ── GENERAL: History ──
  {id:'q91',subject:'general',difficulty:0.3,content:'Who was the first president of the United States?',options:['Abraham Lincoln','Thomas Jefferson','George Washington','John Adams'],correct:2,explanation:'George Washington, 1789',concepts:['gen-world-history']},
  {id:'q92',subject:'general',difficulty:0.4,content:'In which year did the Titanic sink?',options:['1905','1912','1920','1898'],correct:1,explanation:'April 15, 1912',concepts:['gen-world-history']},
  {id:'q93',subject:'general',difficulty:0.5,content:'Which ancient civilization built the pyramids?',options:['Romans','Greeks','Egyptians','Aztecs'],correct:2,explanation:'Ancient Egyptians built the Great Pyramids',concepts:['gen-world-history']},
  // ── GENERAL: Famous People ──
  {id:'q94',subject:'general',difficulty:0.25,content:'Who painted the Mona Lisa?',options:['Picasso','Da Vinci','Michelangelo','Van Gogh'],correct:1,explanation:'Leonardo da Vinci painted it',concepts:['gen-famous-people']},
  {id:'q95',subject:'general',difficulty:0.3,content:'Who discovered gravity?',options:['Einstein','Newton','Galileo','Darwin'],correct:1,explanation:'Isaac Newton formulated the law of gravity',concepts:['gen-famous-people']},
  // ── GENERAL: Nature & Animals ──
  {id:'q96',subject:'general',difficulty:0.2,content:'What is the largest animal on Earth?',options:['Elephant','Giraffe','Blue Whale','Great White Shark'],correct:2,explanation:'Blue whales can reach 30 meters',concepts:['gen-nature-animals']},
  {id:'q97',subject:'general',difficulty:0.2,content:'How many legs does a spider have?',options:['6','8','10','12'],correct:1,explanation:'Spiders are arachnids with 8 legs',concepts:['gen-nature-animals']},
  // ── GENERAL: Arts & Literature ──
  {id:'q98',subject:'general',difficulty:0.4,content:'Who wrote "Harry Potter"?',options:['J.R.R. Tolkien','J.K. Rowling','C.S. Lewis','Roald Dahl'],correct:1,explanation:'J.K. Rowling wrote the Harry Potter series',concepts:['gen-arts-literature']},
  {id:'q99',subject:'general',difficulty:0.4,content:'What instrument has 88 keys?',options:['Guitar','Violin','Piano','Flute'],correct:2,explanation:'A standard piano has 88 keys',concepts:['gen-arts-literature']},
  // ── GENERAL: Sports ──
  {id:'q100',subject:'general',difficulty:0.25,content:'How many players are on a soccer team?',options:['9','10','11','12'],correct:2,explanation:'11 players per side',concepts:['gen-sports']},
  {id:'q101',subject:'general',difficulty:0.25,content:'In which sport do you use a shuttlecock?',options:['Tennis','Badminton','Cricket','Golf'],correct:1,explanation:'Badminton uses a shuttlecock',concepts:['gen-sports']},
  // ── GENERAL: Technology ──
  {id:'q102',subject:'general',difficulty:0.35,content:'What does "CPU" stand for?',options:['Central Processing Unit','Computer Personal Unit','Central Program Utility','Core Processing Unit'],correct:0,explanation:'Central Processing Unit',concepts:['gen-technology']},
  {id:'q103',subject:'general',difficulty:0.35,content:'Who co-founded Apple Inc.?',options:['Bill Gates','Steve Jobs','Jeff Bezos','Elon Musk'],correct:1,explanation:'Steve Jobs co-founded Apple in 1976',concepts:['gen-technology']},

  // ── More Math to fill gaps ──
  {id:'q104',subject:'math',difficulty:0.2,content:'What is 100 ÷ 5?',options:['15','20','25','30'],correct:1,explanation:'100÷5=20',concepts:['math-arithmetic']},
  {id:'q105',subject:'math',difficulty:0.15,content:'What is 6 + 9?',options:['13','14','15','16'],correct:2,explanation:'6+9=15',concepts:['math-arithmetic']},
  {id:'q106',subject:'math',difficulty:0.35,content:'If x = 3, what is x² + 1?',options:['7','9','10','12'],correct:2,explanation:'9+1=10',concepts:['math-exponents']},
  {id:'q107',subject:'math',difficulty:0.5,content:'What is the ratio 12:8 in simplest form?',options:['6:4','3:2','4:3','2:1'],correct:1,explanation:'Divide both by 4: 3:2',concepts:['math-ratios']},
  {id:'q108',subject:'math',difficulty:0.3,content:'What is 2/5 as a percentage?',options:['20%','25%','40%','50%'],correct:2,explanation:'2÷5=0.4=40%',concepts:['math-percentages']},
  {id:'q109',subject:'math',difficulty:0.45,content:'What is the area of a triangle with base 10 and height 6?',options:['16','30','60','36'],correct:1,explanation:'A=½×b×h=½×10×6=30',concepts:['math-area-perimeter']},
  {id:'q110',subject:'math',difficulty:0.65,content:'Expand (x+2)(x+3)',options:['x²+5x+5','x²+5x+6','x²+6x+6','2x+5'],correct:1,explanation:'x²+3x+2x+6=x²+5x+6',concepts:['math-polynomials']},

  // ── More Science ──
  {id:'q111',subject:'science',difficulty:0.5,content:'What type of wave is sound?',options:['Transverse','Longitudinal','Electromagnetic','Static'],correct:1,explanation:'Sound is a longitudinal wave',concepts:['sci-light-sound']},
  {id:'q112',subject:'science',difficulty:0.5,content:'What color of light has the shortest wavelength?',options:['Red','Green','Blue','Violet'],correct:3,explanation:'Violet has the shortest visible wavelength',concepts:['sci-light-sound']},
  {id:'q113',subject:'science',difficulty:0.55,content:'What particles carry electric charge in a wire?',options:['Protons','Neutrons','Electrons','Photons'],correct:2,explanation:'Electrons flow through conductors',concepts:['sci-electricity']},
  {id:'q114',subject:'science',difficulty:0.55,content:'What is rust?',options:['Iron + water','Iron oxide','Pure iron','Carbon dioxide'],correct:1,explanation:'Rust is iron oxide (Fe₂O₃)',concepts:['sci-chemical-react']},

  // ── More English ──
  {id:'q115',subject:'english',difficulty:0.15,content:'Which is a pronoun?',options:['Run','She','Beautiful','Quickly'],correct:1,explanation:'She replaces a noun',concepts:['eng-nouns-pronouns']},
  {id:'q116',subject:'english',difficulty:0.25,content:'Which sentence uses a comma correctly?',options:['I ate, pizza.','Before lunch, I studied.','She is, tall.','We went, home.'],correct:1,explanation:'Comma after introductory phrase',concepts:['eng-punctuation']},
  {id:'q117',subject:'english',difficulty:0.4,content:'What is a simile?',options:['A type of poem','A comparison using like/as','An exaggeration','A repeated sound'],correct:1,explanation:'Simile compares using "like" or "as"',concepts:['eng-sentence-struct']},

  // ── More General ──
  {id:'q118',subject:'general',difficulty:0.5,content:'What is the currency of Japan?',options:['Yuan','Won','Yen','Peso'],correct:2,explanation:'The Japanese Yen (¥)',concepts:['gen-world-geography']},
  {id:'q119',subject:'general',difficulty:0.4,content:'Who wrote "A Brief History of Time"?',options:['Einstein','Hawking','Newton','Feynman'],correct:1,explanation:'Stephen Hawking, published 1988',concepts:['gen-famous-people']},
  {id:'q120',subject:'general',difficulty:0.3,content:'What sport is played at Wimbledon?',options:['Cricket','Golf','Tennis','Rugby'],correct:2,explanation:'Wimbledon is a tennis tournament',concepts:['gen-sports']},
];
