import { StoryEvent } from '../types';

export const EVENTS: StoryEvent[] = [
  // ═══════════════════════════════════════════════════
  // EVENT 1: The Dying Cultivator (starter)
  // ═══════════════════════════════════════════════════
  {
    id: 'dying_cultivator',
    title: 'The Dying Cultivator',
    locationId: 'azure_cloud_village',
    category: 'story',
    trigger: { type: 'location', locationId: 'azure_cloud_village' },
    chainId: 'shadow_beneath_peaks',
    chainStage: 1,
    description:
      'Old Guo, the village gatekeeper, hobbles toward you across the temple courtyard. His face is tight with worry.\n\n"Li Wei! A wandering cultivator collapsed at the east gate. He\'s burning with fever, muttering about \'the shadow in the pass.\' The headman wants him gone. The healer says he\'ll die without a Moondew Bloom from the Whispering Forest."\n\nOld Guo looks at you expectantly. "What should we do?"',
    choices: [
      {
        id: 'find_herb',
        text: '"I\'ll go to the forest and find the herb."',
        tooltip: 'Travel to Whispering Forest. Danger possible.',
        outcome: {
          flavorText:
            'You nod. "Keep him alive until I return."\n\nOld Guo grips your shoulder. "Be careful, child. The forest has teeth."\n\nYou gather your things and head for the east gate.',
          itemsGained: ['spirit_herb_moondew'],
          flagsSet: { accepted_herb_quest: true },
          travelTo: 'whispering_forest',
          nextEventId: 'herb_hunt',
        },
      },
      {
        id: 'examine',
        text: '"Let me examine him first."',
        tooltip: 'Requires: Comprehension 10+',
        requires: { stat: { name: 'comprehension', min: 10 } },
        outcome: {
          flavorText:
            'You kneel beside the stranger. His robes are travel-worn but finely made. A faded emblem — a white crane against azure sky.\n\nYour knowledge serves you: Cloud Soaring Sect.\n\nHis eyes flicker open. "You... you have the sight. The fox blood. Go to the pass. Before it\'s too late."\n\nHis eyes close again. He\'s alive, but barely.\n\n+1 Comprehension. New knowledge: Cloud Soaring Sect.',
          statChanges: { comprehension: 1 },
          itemsGained: ['spirit_herb_moondew'],
          flagsSet: { examined_cultivator: true, knows_cloud_sect: true, accepted_herb_quest: true },
          travelTo: 'whispering_forest',
          nextEventId: 'herb_hunt',
        },
      },
      {
        id: 'refuse',
        text: '"Let the headman handle it. Not our problem."',
        outcome: {
          flavorText:
            'Old Guo\'s face falls. "I understand. You\'re just a sweeper. It\'s not your burden."\n\nHe turns and walks away. The cultivator will be expelled by nightfall. Whatever warning he carried will die with him.\n\nThe village goes back to sleep.',
          karmaChange: -5,
          flagsSet: { refused_cultivator: true },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 2: The Herb Hunt
  // ═══════════════════════════════════════════════════
  {
    id: 'herb_hunt',
    title: 'The Herb Hunt',
    locationId: 'whispering_forest',
    category: 'story',
    trigger: { type: 'flag', flag: 'accepted_herb_quest' },
    chainId: 'shadow_beneath_peaks',
    chainStage: 2,
    description:
      'You\'ve reached the Whispering Forest. After an hour of searching, you find it: a pale blue Moondew Bloom growing on a rocky outcrop.\n\nBut a Shadow-Touched Wolf guards it, gnawing on deer bones. It hasn\'t seen you yet.',
    choices: [
      {
        id: 'fight_wolf',
        text: '"Fight the wolf. The herb is worth the risk."',
        outcome: {
          flavorText: 'You draw your weapon and step into the clearing.\n\nThe wolf\'s head snaps up. It snarls.\n\nCombat begins.',
          combat: {
            name: 'Shadow-Touched Wolf',
            health: 30,
            attack: 5,
            defense: 2,
            speed: 6,
            loot: { stones: [5, 10], items: ['beast_core_low'] },
          },
          flagsSet: { killed_shadow_wolf: true, got_moondew: true },
          nextEventId: 'return_with_herb',
        },
      },
      {
        id: 'stealth_wolf',
        text: '"Wait until dark. Move quietly."',
        tooltip: 'Requires: Spirit Fox race',
        requires: { race: 'spirit_fox' },
        outcome: {
          flavorText:
            'You circle upwind, fox-blood instincts sharpening your senses. A thrown stone distracts the wolf. You dart forward, snatch the Moondew Bloom, and retreat.\n\nNo combat. No injury.\n\nThe wolf never knew you were there.',
          itemsGained: ['beast_core_low'],
          flagsSet: { spared_shadow_wolf: true, got_moondew: true },
          nextEventId: 'return_with_herb',
        },
      },
      {
        id: 'retreat_wolf',
        text: '"Forget the herb. Return to the village."',
        outcome: {
          flavorText:
            'You watch the wolf for a long moment. Then turn back.\n\nThe cultivator will die without the herb. Whatever warning he carried will never reach its destination.',
          karmaChange: -3,
          flagsSet: { abandoned_cultivator: true },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 3: Return With The Herb
  // ═══════════════════════════════════════════════════
  {
    id: 'return_with_herb',
    title: 'The Healer\'s Hut',
    locationId: 'azure_cloud_village',
    category: 'story',
    trigger: { type: 'flag', flag: 'got_moondew' },
    chainId: 'shadow_beneath_peaks',
    chainStage: 3,
    description:
      'You return to Azure Cloud Village with the Moondew Bloom. Mother Shen, the village healer, brews it into a strong tea and pours it down the cultivator\'s throat.\n\nHis fever breaks within the hour. His eyes open — clear, this time. He looks at you.\n\n"You saved me. Why?"\n\nMother Shen leaves you two alone.',
    choices: [
      {
        id: 'altruistic',
        text: '"Because it was the right thing to do."',
        outcome: {
          flavorText:
            'The cultivator studies you. A long, quiet moment.\n\n"Not many would risk the forest for a stranger." He reaches into his robe and produces a jade token. "I am Wei Liang, once of the Cloud Soaring Sect. The seal in the mountain pass is breaking. Something is coming through. Take this token — find Elder Ming at the Cloud Sect. Tell him what happened. He will know what to do."\n\nHe presses the warm jade into your hand.',
          karmaChange: 5,
          itemsGained: ['jade_token'],
          flagsSet: { met_wei_liang: true, knows_about_seal: true },
          shenChange: 5,
        },
      },
      {
        id: 'curious',
        text: '"Tell me about the shadow in the pass."',
        outcome: {
          flavorText:
            'Wei Liang\'s face darkens. "I was sent to inspect an old seal — an ancient formation that holds something beneath the mountain. It was... fracturing. And something on the other side was aware of me."\n\nHe shivers. "It followed me here. In my dreams. At the edge of my vision."\n\nHe gives you the token. "Find Elder Ming. He\'ll believe you."',
          itemsGained: ['jade_token'],
          flagsSet: { met_wei_liang: true, knows_about_seal: true },
          shenChange: 3,
        },
      },
      {
        id: 'demand_payment',
        text: '"I saved your life. That\'s worth something."',
        tooltip: 'Requires: Charisma 15+ (locked for MVP)',
        requires: { stat: { name: 'comprehension', min: 15 } },
        outcome: {
          flavorText:
            'Wei Liang\'s expression cools. "Of course. A cultivator\'s debts should be paid." He tosses a small pouch of spirit stones onto the bed. "Fifty stones. We\'re even."\n\nHe turns away. The conversation is over. You have your payment, but you wonder if you lost something else.',
          spiritStones: 50,
          karmaChange: -3,
          flagsSet: { demanded_payment: true },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 4: Breakthrough to Tier 1
  // ═══════════════════════════════════════════════════
  {
    id: 'breakthrough_tier_1',
    title: 'The First Breakthrough',
    locationId: 'any',
    category: 'breakthrough',
    trigger: { type: 'shenThreshold', min: 10 },
    description:
      'The shén you\'ve gathered swirls in your dantian. Your experiences — the dying cultivator, the wolf in the forest, every choice you\'ve made — have accumulated into pressure.\n\nThe walls of your dantian creak.\n\nA breakthrough is imminent.',
    choices: [
      {
        id: 'steady',
        text: '"Meditate calmly. Let it settle naturally."',
        tooltip: 'Standard breakthrough. 75% chance.',
        outcome: {
          flavorText:
            'You breathe. The shén stills. Then — like ice cracking in spring — the walls of your dantian expand.\n\nTIER 1 REACHED. The world sharpens.\n\n+5 Attack, +5 Defense, +20 Max HP.\nYour shén capacity increases. You are now an Initiate.',
          statChanges: { attack: 5, defense: 5 },
          shenChange: 10,
          flagsSet: { reached_tier_1: true },
        },
      },
      {
        id: 'force_breakthrough',
        text: '"Force it. I\'ve earned this."',
        tooltip: '+15% chance. But failure hurts more.',
        outcome: {
          flavorText:
            'You seize the shén and PUSH.\n\nThe walls shatter — not gently, but gloriously. A pulse of energy visible for a hundred paces.\n\nTIER 1 REACHED.\n\n+7 Attack, +3 Defense, +20 Max HP.\nBut the strain costs you: -5 HP.',
          statChanges: { attack: 7, defense: 3 },
          healthChange: -5,
          shenChange: 10,
          flagsSet: { reached_tier_1: true, forceful_breakthrough: true },
        },
      },
      {
        id: 'guided_breakthrough',
        text: '"Ask the village healer to guide me."',
        tooltip: 'Requires: Karma 3+',
        requires: { karma: { min: 3 } },
        outcome: {
          flavorText:
            'Mother Shen places a weathered hand on your back. "Breathe, child. The shén is like water — don\'t fight it. Guide it."\n\nHer voice steadies you. The breakthrough is gentle, almost peaceful.\n\nTIER 1 REACHED.\n\n+5 Attack, +5 Defense, +20 Max HP.\n+3 Comprehension from Mother Shen\'s teaching.',
          statChanges: { attack: 5, defense: 5, comprehension: 3 },
          shenChange: 10,
          flagsSet: { reached_tier_1: true, mother_shen_guided: true },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 5: First Beast Encounter (travel event)
  // ═══════════════════════════════════════════════════
  {
    id: 'travel_beast_ambush',
    title: 'Roadside Ambush',
    locationId: 'any',
    category: 'encounter',
    trigger: { type: 'travel' },
    description:
      'As you travel, the underbrush rustles. A pair of glowing eyes emerges from the shadows.\n\nA Forest Viper lunges!',
    choices: [
      {
        id: 'fight_viper',
        text: '"Draw your weapon. Fight."',
        outcome: {
          flavorText: 'The viper strikes fast. You barely raise your blade in time.\n\nCombat begins.',
          combat: {
            name: 'Forest Viper',
            health: 15,
            attack: 4,
            defense: 1,
            speed: 8,
            loot: { stones: [2, 5], items: ['beast_core_low'] },
          },
        },
      },
      {
        id: 'dodge_viper',
        text: '"Dodge and keep moving. Not worth the fight."',
        tooltip: 'Requires: Speed 7+',
        requires: { stat: { name: 'speed', min: 7 } },
        outcome: {
          flavorText:
            'You sidestep at the last moment. The viper\'s fangs graze your sleeve — but you\'re already past it, walking away.\n\nIt hisses but does not pursue. Some fights are optional.',
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 6: Green Jade City — Merchant Encounter
  // ═══════════════════════════════════════════════════
  {
    id: 'city_merchant',
    title: 'The Wandering Merchant',
    locationId: 'green_jade_city',
    category: 'encounter',
    trigger: { type: 'location', locationId: 'green_jade_city' },
    description:
      'A weathered merchant has set up shop in the market square. Colorful wares are spread across his stall — crystals, scrolls, and odd trinkets.\n\n"You there, young cultivator! You have the look of someone who needs an edge. Come, come — see what Old Feng has for sale!"',
    choices: [
      {
        id: 'browse',
        text: '"Show me what you have."',
        outcome: {
          flavorText:
            'Old Feng grins, revealing a gap-toothed smile. "Ah, a browser! I like you already."\n\nHe gestures at his wares:\n- Qi Crystal: 5 stones each (contains 0.5 S)\n- Healing Pill: 10 stones (restores 20 HP)\n- Storage Jade: 20 stones (+5 shén capacity)\n\n"See anything you like?"\n\n(You may buy items from the Self tab while in Green Jade City.)',
          flagsSet: { met_old_feng: true },
        },
      },
      {
        id: 'ask_news',
        text: '"What news from the road?"',
        tooltip: 'Requires: Spirit Stones 10+',
        requires: { stat: { name: 'comprehension', min: 8 } },
        outcome: {
          flavorText:
            'Old Feng leans in. "Funny you should ask. I heard the Cloud Soaring Sect has recalled all their outer disciples. Something about the old seal in the mountain pass. They\'re locking down the Misty Peaks road."\n\nHe taps his nose. "Between you and me? That seal\'s been there since before the city was built. If it\'s breaking now... something big is coming."\n\nThe news unsettles you. You file it away.',
          flagsSet: { heard_seal_news: true },
          shenChange: 2,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 7: Misty Peaks — Cultivation Spot Discovery
  // ═══════════════════════════════════════════════════
  {
    id: 'misty_peaks_discovery',
    title: 'The Ancient Meditation Cave',
    locationId: 'misty_peaks',
    category: 'discovery',
    trigger: { type: 'location', locationId: 'misty_peaks' },
    description:
      'Exploring the Misty Peaks, you find a cave hidden behind a waterfall. Inside, the walls are covered in faded runes. The air is thick with qi — centuries of cultivators meditating here have saturated the stone.\n\nA flat rock at the center seems made for sitting.',
    choices: [
      {
        id: 'meditate_cave',
        text: '"Sit and meditate. The qi here is incredible."',
        outcome: {
          flavorText:
            'You sit on the meditation stone. The runes pulse faintly as you breathe. Qi flows into you like a river — faster than anywhere you\'ve ever cultivated.\n\nThe cave remembers every cultivator who sat here before you. It shares their patience.\n\n+3 Comprehension (permanent). The cave\'s wisdom lingers.',
          statChanges: { comprehension: 3 },
          shenChange: 10,
          flagsSet: { found_meditation_cave: true },
        },
      },
      {
        id: 'study_runes',
        text: '"Study the runes on the wall."',
        outcome: {
          flavorText:
            'You trace the faded inscriptions. They tell a story: a lone cultivator sealed something beneath the mountain, then sat here until they became one with the stone.\n\nThe last line reads: "The seal holds. But nothing holds forever."\n\n+5 Comprehension. You understand the seal\'s origin now.',
          statChanges: { comprehension: 5 },
          flagsSet: { studied_cave_runes: true, knows_about_seal: true },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 8: Breakthrough to Tier 2
  // ═══════════════════════════════════════════════════
  {
    id: 'breakthrough_tier_2',
    title: 'Deepening Foundation',
    locationId: 'any',
    category: 'breakthrough',
    trigger: { type: 'shenThreshold', min: 1000 },
    description:
      'Your dantian pulses with accumulated power. 1 kS of shén churns within you — ten times what it held before.\n\nThe world feels... thin. Like you\'re seeing through a veil you didn\'t know was there.\n\nTier 2 awaits.',
    choices: [
      {
        id: 'steady_t2',
        text: '"Meditate. Let the foundation settle."',
        outcome: {
          flavorText:
            'You sit. The shén compresses. Your dantian widens.\n\nTIER 2 REACHED.\n\n+10 Attack, +10 Defense, +40 Max HP.\nYou can now access the Black Wind Gorge.',
          statChanges: { attack: 10, defense: 10 },
          shenChange: 100,
          flagsSet: { reached_tier_2: true },
        },
      },
      {
        id: 'aggressive_t2',
        text: '"Push harder. Break through faster."',
        outcome: {
          flavorText:
            'You force the breakthrough. Energy surges, overwhelming.\n\nTIER 2 REACHED.\n\n+15 Attack, +5 Defense, +40 Max HP.\nBut your body pays the price: -15 HP from the strain.',
          statChanges: { attack: 15, defense: 5 },
          healthChange: -15,
          shenChange: 100,
          flagsSet: { reached_tier_2: true, forced_tier_2: true },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 9: Black Wind Gorge — Shadow Remnants
  // ═══════════════════════════════════════════════════
  {
    id: 'black_wind_encounter',
    title: 'Whispers in the Gorge',
    locationId: 'black_wind_gorge',
    category: 'encounter',
    trigger: { type: 'location', locationId: 'black_wind_gorge' },
    description:
      'The wind howls through Black Wind Gorge like a living thing. At your feet, a half-buried formation flag bears the mark of Shadow Heaven Sect.\n\nThe shadows between the rocks seem to... move.',
    choices: [
      {
        id: 'investigate_flag',
        text: '"Pull the flag. See what it marks."',
        outcome: {
          flavorText:
            'You wrench the formation flag from the earth. The wind stops — suddenly, completely.\n\nA voice behind you: "I wouldn\'t have done that."\n\nA figure in dark robes watches you from the cliff above. "That flag was marking a corpse. A disciple who failed our sect\'s trial. You\'ve just released his spirit."\n\nThe air grows cold. A ghostly form rises from the ground where the flag stood.\n\nCombat begins!',
          combat: {
            name: 'Vengeful Shadow Disciple',
            health: 45,
            attack: 8,
            defense: 3,
            speed: 7,
            loot: { stones: [10, 20], items: ['qi_crystal'] },
          },
          flagsSet: { disturbed_shadow_grave: true },
        },
      },
      {
        id: 'leave_flag',
        text: '"Leave it. This place has a history I don\'t need to disturb."',
        outcome: {
          flavorText:
            'You step carefully around the flag and continue down the gorge. The shadows watch, but do not follow.\n\nSometimes wisdom is knowing when not to dig.',
          shenChange: 3,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 10: Breakthrough to Tier 3 — Path Choice
  // ═══════════════════════════════════════════════════
  {
    id: 'breakthrough_tier_3',
    title: 'The Fork in the Dao',
    locationId: 'any',
    category: 'breakthrough',
    trigger: { type: 'shenThreshold', min: 100000 },
    description:
      'Your shén has reached 100 kS — the threshold of Foundation Establishment. Your dantian strains. It can expand further — but only if you choose a direction.\n\nThe Dao is not one road. It is a vast plain with many trails.\n\nTwo paths stretch before you.',
    choices: [
      {
        id: 'choose_qi',
        text: '🧘 **Qi Path** — "I will cultivate the energy of heaven, earth, and stars. The rhythm of the universe flows through my meridians."',
        outcome: {
          flavorText:
            'You sit at the edge of a cliff overlooking the mist-lit peaks. The shén within you takes on the quality of the wind — flowing, searching, connecting.\n\nYour meridians open. A new world of practice awaits.\n\nQI PATH CHOSEN.',
          statChanges: { comprehension: 3 },
          shenChange: 1000,
          flagsSet: { path_chosen: true, path_qi: true },
        },
      },
      {
        id: 'choose_body',
        text: '💪 **Body Path** — "I will temper my flesh until it transcends mortal limits. My body is my weapon, my temple, my truth."',
        outcome: {
          flavorText:
            'You walk into the wilderness, find the heaviest rock you can lift, and lift it until your arms fail. Then you lift it again.\n\nYour muscles tear and rebuild. Your flesh remembers.\n\nBODY PATH CHOSEN.',
          statChanges: { attack: 5, defense: 3 },
          healthChange: 10,
          shenChange: 1000,
          flagsSet: { path_chosen: true, path_body: true },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EVENT 11: Travel — Peaceful Moment
  // ═══════════════════════════════════════════════════
  {
    id: 'travel_peaceful',
    title: 'A Moment of Stillness',
    locationId: 'any',
    category: 'encounter',
    trigger: { type: 'travel' },
    description:
      'The road opens into a clearing. Sunlight falls through the canopy in golden shafts. Birds sing.\n\nFor a moment, there is no danger. No deadline. No shadow in the pass. Just you, the path, and the world breathing around you.',
    choices: [
      {
        id: 'rest_and_absorb',
        text: '"Sit and absorb the ambient shén."',
        outcome: {
          flavorText:
            'You sit beneath a great tree and close your eyes. The world\'s quiet shén flows into you like water finding its level.\n\nWhen you open your eyes, an hour has passed. You feel... centered.',
          shenChange: 5,
          healthChange: 10,
        },
      },
      {
        id: 'keep_walking',
        text: '"Keep moving. Rest is a luxury."',
        outcome: {
          flavorText:
            'You pause just long enough to feel the sun on your face, then continue down the road.\n\nThe moment stays with you, even as you walk. You carry the stillness forward.',
          shenChange: 2,
        },
      },
    ],
  },
];
