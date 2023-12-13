class Deck {
    constructor() {
        this.cards = [];
        const suits = Object.values(CardSuits);
        const values = Object.keys(CardValues);

        for (const suit of suits) {
            for (const value of values) {
                this.cards.push(new Card(value, suit));
            }
        }

        console.log('Initializing deck of cards')
    }

    shuffle() {
        console.log('Shuffling the cards')

        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
}

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.hasCrackHand = false;
        this.isWinner = false;
        this.points = {
            head: 0,
            body: 0,
            tail: 0,
            overall: 0
        };
        this.hand = {
            head: [],
            body: [],
            tail: []
        };
        this.cards = []
        this.handRank = null
    }

    receiveCards(cards) {
        const totalCards = cards.length;
        const head = cards.slice(0, 3);
        const body = cards.slice(3, 8);
        const tail = cards.slice(8);

        this.hand.head = head;
        this.hand.body = body;
        this.hand.tail = tail;

        this.cards = this.hand.head.concat([...this.hand.body, ...this.hand.tail])
    }

    hasValidHead() {
        return Ranker2.evaluate(this.hand.head, gameRules.head)
            .loseTo(Ranker2.evaluate(this.hand.body, gameRules.body))
    }

    hasValidBody() {
        return Ranker2.evaluate(this.hand.body, gameRules.body)
            .loseTo(Ranker2.evaluate(this.hand.tail, gameRules.tail))
    }

    hasValidTail() {
        return !Ranker2.evaluate(this.hand.tail, gameRules.tail)
            .loseTo(Ranker2.evaluate(this.hand.body, gameRules.body))
    }

    hasValidHand() {
        return this.hasValidHead() && this.hasValidBody() && this.hasValidTail()
    }

    findCard(card) {
        // Check in the head
        const headIndex = this.hand.head.findIndex(c => c.value === card.value && c.suit.name === card.suit);
        if (headIndex !== -1) {
            return { section: 'head', index: headIndex };
        }

        // Check in the body
        const bodyIndex = this.hand.body.findIndex(c => c.value === card.value && c.suit.name  === card.suit);
        if (bodyIndex !== -1) {
            return { section: 'body', index: bodyIndex };
        }

        // Check in the tail
        const tailIndex = this.hand.tail.findIndex(c => c.value === card.value && c.suit.name  === card.suit);
        if (tailIndex !== -1) {
            return { section: 'tail', index: tailIndex };
        }

        // Card not found
        return null;
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            hand: this.hand
        };
    }

    deserialize(data) {
        this.id = data.id;
        this.name = data.name;

        this.hand.head = data.hand.head.map(card => new Card(card.value, card.suit));
        this.hand.body = data.hand.body.map(card => new Card(card.value, card.suit));
        this.hand.tail = data.hand.tail.map(card => new Card(card.value, card.suit));
        this.cards = this.hand.head.concat([...this.hand.body, ...this.hand.tail])
    }
}





class Game {
    constructor() {
        this.deck = new Deck();
        this.players = [];
        this.allowPlayerSwapCards = false
        this.logs = []
        this.qualifiedPlayers = [];
        this.hasWinner = false;
        this.round = 1;
        this.roundLimit = 5;
        this.winners = [];
        this.isShuffling = false
        this.isDealingCards = false

        // this.loadFromLocalStorage()
    }

    resetDeclaration () {
        this.logs = []
        this.qualifiedPlayers = [];
        this.hasWinner = false;
        this.round = 1;
        this.winners = [];
    }

    serializeGameState() {
        return JSON.stringify({
            players: this.players.map(player => player.serialize()),
            allowPlayerSwapCards: this.allowPlayerSwapCards
        });
    }

    saveToLocalStorage() {
        const gameState = this.serializeGameState();
        localStorage.setItem('gameState', gameState);
    }

    clearLocalStorage() {
        localStorage.removeItem('gameState')
    }

    loadFromLocalStorage() {
        console.log('Loading data from local storage')
        const gameState = localStorage.getItem('gameState');
        if (gameState) {
            const parsedState = JSON.parse(gameState);

            this.allowPlayerSwapCards = parsedState.allowPlayerSwapCards;

            // Restore players
            this.players = parsedState.players.map(playerData => {
                const player = new Player(playerData.id, playerData.name);
                player.deserialize(playerData);
                // player.receiveCards(playerData.cards)
                return player;
            });
        }
    }

    setup() {
        console.log('Setting up game')
        console.log('Checking for local storage data')
        const gameState = localStorage.getItem('gameState');

        if(gameState) {
            this.loadFromLocalStorage()
            this.playDealAnimation()
        } else {
            this.restart()
        }
    }

    initializePlayers() {
        for (let i = 1; i <= 4; i++) {
            const player = new Player(i, `Player ${i}`);
            this.players.push(player);
        }
    }

    playShuffleAnimation() {
        this.isShuffling = true;

        setTimeout(() => {
            this.isShuffling = false

            this.playDealAnimation()
        }, 4500);
    }

    playDealAnimation() {
        setTimeout(() => {
            this.players.forEach(player => {
                this.isDealingCards = true
                player.cards.forEach(card => {
                    card.dealCardAnimation();
                });
            });

            this.isDealingCards = false
        }, 500);
    }

    dealCards() {
        this.deck.shuffle();

        for (const player of this.players) {
            const playerCards = this.deck.cards.splice(0, 13);
            player.receiveCards(playerCards);
        }

        this.saveToLocalStorage()
        this.playShuffleAnimation()

        console.log('Finished dealing cards to players')
    }

    restart() {
        this.clearLocalStorage();
        this.resetDeclaration();

        this.deck = new Deck();
        this.players = [];

        this.initializePlayers();
        this.dealCards();
    }

    findPlayer(playerId) {
        return this.players.find(player => player.id === playerId)
    }

    swapCards(owner1, section1, index1, owner2, section2, index2) {
        const sectionArray1 = owner1.hand[section1];
        const sectionArray2 = owner2.hand[section2];

        // Check if the indices are valid
        if (index1 < 0 || index1 >= sectionArray1.length || index2 < 0 || index2 >= sectionArray2.length) {
            console.error('Invalid indices for swapping cards.');
            return;
        }

        const card1 = sectionArray1[index1];
        // Swap the positions of the cards between two sections
        owner1.hand[section1][index1] = sectionArray2[index2]
        owner2.hand[section2][index2] = card1

        this.saveToLocalStorage()
    }

    displayPlayerHands() {
        for (const player of this.players) {
            console.log(`${player.name}'s hand:`);
            console.log(player.hand.head)
            // console.log('Head:', player.hand.head.map(card => card.toString()));
            // console.log('Body:', player.hand.body.map(card => card.toString()));
            // console.log('Tail:', player.hand.tail.map(card => card.toString()));
            console.log('-------------------');
        }
    }

    calculatePlayerPoints(players) {
        for (const player of players) {
            let vsPlayers = players.filter(vsPlayer => vsPlayer.id !== player.id)

            player.points.head = this.calculatePointsForPlayerSection(player, 'head', vsPlayers)
            player.points.body = this.calculatePointsForPlayerSection(player, 'body', vsPlayers)
            player.points.tail = this.calculatePointsForPlayerSection(player, 'tail', vsPlayers)
            player.points.overall = player.points.head + player.points.body + player.points.tail;
        }
    }

    calculateSpecialHandPoints (players) {
        for (const player of players) {
            let vsPlayers = players.filter(vsPlayer => vsPlayer.id !== player.id)

            player.points.tail = this.calculatePointsForPlayerSection(player, 'tail', vsPlayers)
            player.points.overall = player.points.tail ;
        }
    }

    calculatePointsForPlayerSection(currentPlayer, section, vsPlayers) {
        let enemyPlayerHands = vsPlayers.map(player => Ranker2.evaluate(player.hand[section], gameRules[section]));

        return  Ranker2.evaluate(currentPlayer.hand[section], gameRules[section]).calculatePoints(...enemyPlayerHands);
    }

    checkForSpecialHands() {
        console.log('Checking for special hands')

        const specialHandTypes = [Dragon, TwoToNine, ThreeFlushes, ThreeStraights, SixPairs, StraightFlushHand, FourOfAKindHand];

        for (const handType of specialHandTypes) {
            const specialHands = this.qualifiedPlayers.filter(player => player.handRank instanceof handType);

            if (specialHands.length > 0) {
                console.log('Determining winner for special card holders')

                this.qualifiedPlayers = specialHands;

                if((handType.name === StraightFlushHand.name
                    && specialHands.length > 1)
                    || (handType.name === FourOfAKindHand.name
                        && specialHands.length > 1))
                {
                    this.round++;
                    this.determineSpecialHandWinner()
                } else {
                    this.hasWinner = true;
                    this.markWinners(this.qualifiedPlayers);
                }

                break;
            }
        }

        if (!this.hasWinner) {
            console.log('No special card holder found')
        }
    }

    markWinners(winners) {
        for (const player of winners) {
            player.isWinner = true
        }

        this.logWinners(winners)
    }

    logWinners(winners) {
        this.logs[this.round] = {
            ...this.logs[this.round],
            winners: _.cloneDeep(this.qualifiedPlayers)
        };
    }

    declareWinner() {
        console.log('Declaring winner')

        this.resetDeclaration();
        this.evaluatePlayers();
        this.checkForSpecialHands();
        this.determineRoundWinner();
        this.cleanupLogs();

        console.log('Finished declaring the winner/s')
    }

    evaluatePlayers() {
        console.log('Evaluating player hands')

        for (const player of this.players) {
            player.handRank = Hand.evaluate(player.hand.head, player.hand.body, player.hand.tail)
            player.isWinner = false
            player.hasCrackHand = false

            if(player.hasValidHand()) {
                this.qualifiedPlayers.push(player)
            } else {
                player.hasCrackHand = true
            }
        }

        this.logs[this.round] = {
            round: this.round,
            qualifiedPlayers: _.cloneDeep(this.qualifiedPlayers),
            winners: []
        }
    }

    determineRoundWinner() {
        console.log('Determining winner for current round')

        while (!this.hasWinner) {
            this.calculatePlayerPoints(this.qualifiedPlayers);

            this.logs[this.round] = {
                round: this.round,
                qualifiedPlayers: _.cloneDeep(this.qualifiedPlayers),
                winners: []
            };

            this.qualifiedPlayers = this.getPlayersWIthHighestPoints(this.qualifiedPlayers);

            if (this.checkSingleWinnerCondition()) break;
            if (this.hasReachedRoundLimit()) break;

            this.round++;
        }
    }

    determineSpecialHandWinner () {
        while (!this.hasWinner) {
            this.calculateSpecialHandPoints(this.qualifiedPlayers);

            this.logs[this.round] = {
                round: this.round,
                qualifiedPlayers: _.cloneDeep(this.qualifiedPlayers),
                winners: []
            };

            this.qualifiedPlayers = this.getPlayersWIthHighestPoints(this.qualifiedPlayers);

            if (this.checkSingleWinnerCondition()) break;
            if (this.hasReachedRoundLimit()) break;

            this.round++;
        }
    }

    cleanupLogs() {
        this.logs = this.logs.filter(log => log);
    }

    getPlayersWIthHighestPoints(players) {
        return players.reduce((maxPlayers, currentPlayer) => {
            const currentPoints = currentPlayer.points.overall;
            const maxPoints = maxPlayers[0] ? maxPlayers[0].points.overall : -Infinity;

            if (currentPoints > maxPoints) {
                return [currentPlayer];
            } else if (currentPoints === maxPoints) {
                return [...maxPlayers, currentPlayer];
            } else {
                return maxPlayers;
            }
        }, []);
    }

    checkSingleWinnerCondition() {
        if (this.qualifiedPlayers.length === 1) {
            this.qualifiedPlayers[0].isWinner = true;
            this.hasWinner = true;

            this.logs[this.round] = {
                ...this.logs[this.round],
                winners: _.cloneDeep(this.qualifiedPlayers)
            };

            return true;
        }
        return false;
    }



    hasReachedRoundLimit() {
        if (this.round >= this.roundLimit) {
            this.hasWinner = true;
            this.markWinners(this.qualifiedPlayers);

            return true;
        }
        return false;
    }
}
