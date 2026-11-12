// Word themes the host can pick when creating a lobby.
// `kind: 'holiday'` themes also change the look of the app (the front end
// styles itself from the theme id). `season` is the month range (1-12) when a
// holiday theme is "in season" and gets featured on the home page.

const themes = [
    {
        id: 'classic',
        name: 'Classic',
        kind: 'general',
        emoji: '🎲',
        description: 'A little bit of everything',
        words: [
            'Pizza', 'Beach', 'Guitar', 'Airport', 'Library', 'Volcano', 'Camera', 'Hospital',
            'Bicycle', 'Castle', 'Umbrella', 'Rocket', 'Bakery', 'Circus', 'Island', 'Museum',
            'Laptop', 'Wedding', 'Subway', 'Zoo', 'Pyramid', 'Submarine', 'Campfire', 'Mirror'
        ]
    },
    {
        id: 'animals',
        name: 'Animals',
        kind: 'general',
        emoji: '🐾',
        description: 'Creatures great and small',
        words: [
            'Penguin', 'Giraffe', 'Octopus', 'Kangaroo', 'Owl', 'Dolphin', 'Panda', 'Flamingo',
            'Crocodile', 'Hedgehog', 'Elephant', 'Shark', 'Sloth', 'Peacock', 'Koala', 'Zebra',
            'Bat', 'Camel', 'Jellyfish', 'Raccoon', 'Parrot', 'Turtle', 'Wolf', 'Bee'
        ]
    },
    {
        id: 'food',
        name: 'Food',
        kind: 'general',
        emoji: '🍜',
        description: 'Snacks, meals and desserts',
        words: [
            'Sushi', 'Tacos', 'Pancakes', 'Burrito', 'Ramen', 'Popcorn', 'Lasagna', 'Croissant',
            'Cheesecake', 'Dumplings', 'Nachos', 'Waffles', 'Curry', 'Hot dog', 'Donut', 'Salad',
            'Empanada', 'Pretzel', 'Smoothie', 'Paella', 'Brownie', 'Omelette', 'Churros', 'Pho'
        ]
    },
    {
        id: 'places',
        name: 'Places',
        kind: 'general',
        emoji: '🗺️',
        description: 'Spots around town and the world',
        words: [
            'Gym', 'Movie theater', 'Grocery store', 'Theme park', 'Bowling alley', 'Farm',
            'Space station', 'Dentist', 'Train station', 'Stadium', 'Aquarium', 'Casino',
            'Ski resort', 'Laundromat', 'Jungle', 'Desert', 'Lighthouse', 'Cruise ship',
            'Prison', 'Classroom', 'Car wash', 'Hotel', 'Haunted house', 'Bank'
        ]
    },
    {
        id: 'sports',
        name: 'Sports',
        kind: 'general',
        emoji: '🏀',
        description: 'Games, gear and the big leagues',
        words: [
            'Basketball', 'Soccer', 'Tennis', 'Golf', 'Surfing', 'Boxing', 'Bowling', 'Skiing',
            'Baseball', 'Volleyball', 'Hockey', 'Swimming', 'Gymnastics', 'Karate', 'Archery',
            'Skateboarding', 'Wrestling', 'Fencing', 'Rowing', 'Cycling', 'Badminton', 'Rugby',
            'Marathon', 'Ping pong'
        ]
    },
    {
        id: 'jobs',
        name: 'Jobs',
        kind: 'general',
        emoji: '💼',
        description: 'Who does what for a living',
        words: [
            'Firefighter', 'Chef', 'Astronaut', 'Dentist', 'Pilot', 'Teacher', 'Plumber',
            'Lifeguard', 'Detective', 'Barber', 'Farmer', 'Magician', 'Nurse', 'Librarian',
            'Mechanic', 'Photographer', 'Lawyer', 'Waiter', 'Architect', 'Mail carrier',
            'Zookeeper', 'DJ', 'Scientist', 'Clown'
        ]
    },
    {
        id: 'halloween',
        name: 'Halloween',
        kind: 'holiday',
        emoji: '🎃',
        season: [10, 10],
        description: 'Spooky season',
        words: [
            'Pumpkin', 'Ghost', 'Witch', 'Vampire', 'Zombie', 'Mummy', 'Skeleton', 'Werewolf',
            'Candy corn', 'Black cat', 'Spider web', 'Haunted house', 'Cauldron', 'Broomstick',
            'Costume', 'Trick or treat', 'Graveyard', 'Bat', 'Jack-o-lantern', 'Frankenstein',
            'Potion', 'Scarecrow', 'Coffin', 'Full moon'
        ]
    },
    {
        id: 'thanksgiving',
        name: 'Thanksgiving',
        kind: 'holiday',
        emoji: '🦃',
        season: [11, 11],
        description: 'Feasts, family and football',
        words: [
            'Turkey', 'Stuffing', 'Cranberry sauce', 'Pumpkin pie', 'Mashed potatoes', 'Gravy',
            'Parade', 'Pilgrim', 'Cornucopia', 'Wishbone', 'Football', 'Leftovers', 'Sweet potato',
            'Apple cider', 'Corn', 'Harvest', 'Acorn', 'Scarecrow', 'Hayride', 'Maple leaf',
            'Black Friday', 'Pecan pie', 'Dinner table', 'Nap'
        ]
    },
    {
        id: 'winter-holidays',
        name: 'Winter Holidays',
        kind: 'holiday',
        emoji: '🎄',
        season: [12, 12],
        description: 'Snow, lights and presents',
        words: [
            'Christmas tree', 'Snowman', 'Reindeer', 'Menorah', 'Stocking', 'Gingerbread', 'Elf',
            'Sleigh', 'Candy cane', 'Mistletoe', 'Ornament', 'Hot cocoa', 'Snowflake', 'Present',
            'Fireplace', 'Wreath', 'Dreidel', 'Ice skating', 'Eggnog', 'Santa', 'Carolers',
            'Ugly sweater', 'North Pole', 'New Year countdown'
        ]
    },
    {
        id: 'valentines',
        name: "Valentine's Day",
        kind: 'holiday',
        emoji: '💘',
        season: [2, 2],
        description: 'Hearts and chocolates',
        words: [
            'Roses', 'Chocolate', 'Cupid', 'Love letter', 'Teddy bear', 'Candlelit dinner',
            'Heart', 'Kiss', 'Bouquet', 'Ring', 'Date night', 'Card', 'Perfume', 'Candy hearts',
            'Picnic', 'Serenade', 'Arrow', 'Champagne', 'Dance', 'Poem', 'Locket', 'Balloon',
            'Strawberries', 'Movie night'
        ]
    },
    {
        id: 'fourth-of-july',
        name: 'Fourth of July',
        kind: 'holiday',
        emoji: '🎆',
        season: [7, 7],
        description: 'Fireworks and cookouts',
        words: [
            'Fireworks', 'Barbecue', 'Flag', 'Parade', 'Hot dog', 'Watermelon', 'Sparkler',
            'Picnic', 'Bald eagle', 'Lemonade', 'Beach', 'Statue of Liberty', 'Cornhole',
            'Hamburger', 'Pool party', 'Marching band', 'Apple pie', 'Corn on the cob',
            'Uncle Sam', 'Cooler', 'Sunscreen', 'Lawn chair', 'Ice cream', 'Grill'
        ]
    }
];

const findTheme = (id) => themes.find((t) => t.id === id);

// Holiday themes whose season includes the given date (used to feature one).
const inSeason = (date = new Date()) => {
    const month = date.getMonth() + 1;
    return themes.filter((t) => t.season && month >= t.season[0] && month <= t.season[1]);
};

// Public view of a theme: everything except the word list.
const publicTheme = (t, date = new Date()) => ({
    id: t.id,
    name: t.name,
    kind: t.kind,
    emoji: t.emoji,
    description: t.description,
    wordCount: t.words.length,
    inSeason: inSeason(date).some((s) => s.id === t.id)
});

module.exports = { themes, findTheme, inSeason, publicTheme };
