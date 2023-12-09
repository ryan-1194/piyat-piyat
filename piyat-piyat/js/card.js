

class Card {
    constructor(value, suit) {
        this.suit = suit;
        this.value = value;
        this.nominalValue = CardValues[this.value];

        this.cardAnimationClass = 'hidden';
    }

    toString() {
        return this.value + this.suit.name;
    }

    static sort(a, b) {
        if (a.nominalValue > b.nominalValue) {
            return -1;
        } else if (a.nominalValue < b.nominalValue) {
            return 1;
        } else {
            return 0;
        }
    }

    dealCardAnimation() {
        this.cardAnimationClass = 'card-dealing';

        // Remove the animation class after the animation is complete
        setTimeout(() => {
            this.cardAnimationClass = '';
        }, 500); // Adjust the timeout value based on your animation duration
    }
}

const CardSuits = {
    SPADES: {
        name: 'spades',
        htmlEntity: '&#9824;',
        color: ''
    },
    DIAMONDS: {
        name: 'diamonds',
        htmlEntity: '&#9830;',
        color: 'text-red-500'
    },
    HEART: {
        name: 'heart',
        htmlEntity: '&#9829;',
        color: 'text-red-500'
    },
    CLUBS: {
        name: 'clubs',
        htmlEntity: '&#9827;',
        color: ''
    }
};
const CardValues = {2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10:10, J: 11, Q: 12, K: 13, A: 14};

class Ranker2 {
    constructor(cards, name, rules) {
        this.finalCards = []
        this.originalCards = _.cloneDeep(cards);
        this.sortedCards = this.originalCards.sort(Card.sort)
        this.name = name
        this.rules = rules

        if (this.originalCards.length !== this.rules.requiredCards) {
            throw new Error('Card count should be ' + this.rules.requiredCards);
        }

        if (this.originalCards.length !== new Set(this.originalCards.map(card => card.toString())).size) {
            throw new Error('Duplicate cards');
        }

        let handRank = this.rules.ranking.length;
        for (let i= 0; i < this.rules.ranking.length; i++) {
            if (this.rules.ranking[i] === this.constructor) {
                this.rank = handRank - i;
                break;
            }
        }

        this.isPossible = this.evaluate()
    }

    hasNOfAKind(n) {
        const cardRanks = this.sortedCards.map((card) => card.nominalValue);

        return cardRanks.some((rank) => cardRanks.filter((r) => r === rank).length === n);
    }

    nextHighest() {
        let picks;
        let excluding = [];
        excluding = excluding.concat(this.finalCards);

        picks = this.sortedCards.filter(function(card) {
            if (excluding.indexOf(card) < 0) {
                return true;
            }
        });

        return picks;
    }

    setFinalCards() {
        const cardRanks = this.sortedCards.map((card) => card.nominalValue);
        this.finalCards = this.sortedCards;

        // Check for A-2-3-4-5 straight
        if (
            cardRanks[0] === CardValues.A &&
            cardRanks[1] === CardValues[5] &&
            cardRanks[2] === CardValues[4] &&
            cardRanks[3] === CardValues[3] &&
            cardRanks[4] === CardValues[2]
        ) {
            this.finalCards = [
                this.sortedCards[1],
                this.sortedCards[2],
                this.sortedCards[3],
                this.sortedCards[4],
                this.sortedCards[0]
            ];
        }
    }

    compare(ranker) {
        if (this.rank < ranker.rank) {
            return 1;
        } else if (this.rank > ranker.rank) {
            return -1;
        }

        let result= 0;

        for (let i= 0; i < this.rules.requiredCards; i++) {
            if (this.finalCards[i] && ranker.finalCards[i] && this.finalCards[i].nominalValue < ranker.finalCards[i].nominalValue) {
                result = 1;
                break;
            } else if (this.finalCards[i] && ranker.finalCards[i] && this.finalCards[i].nominalValue > ranker.finalCards[i].nominalValue) {
                result = -1;
                break;
            }
        }

        return result;
    }

    calculatePoints(...rankers) {
        let points = 0;

        rankers.forEach(ranker => {
            points += ranker?.compare(this)
        })

        return points
    }

    loseTo(ranker) {
        return (this.compare(ranker) > 0);
    }

    static evaluate(cards, rules) {
        cards = cards || [''];

        let ranking = rules.ranking;
        let result = null;

        for (let i= 0; i < ranking.length; i++) {
            result = new ranking[i](cards, rules);
            if (result.isPossible) {
                result.setFinalCards()
                break;
            }
        }

        return result;
    }
}

class RoyalFlush extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'Royal Flush', rules);
    }

    evaluate() {
        return (new StraightFlush(this.originalCards, this.rules)).evaluate() &&
            this.sortedCards[0].nominalValue === CardValues.A && this.sortedCards[4].nominalValue === CardValues[10];
    }
}

class StraightFlush extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'Straight Flush', rules);
    }

    evaluate() {
        const isFlush = (new Flush(this.originalCards, this.rules)).evaluate();
        const isStraight = (new Straight(this.originalCards, this.rules)).evaluate();

        return isFlush && isStraight;
    }
}

class FourOfAKind extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'Four of a Kind', rules)
    }

    evaluate() {
        return this.hasNOfAKind(4);
    }

    setFinalCards() {
        const cardRanks = this.sortedCards.map((card) => card.nominalValue);
        const fourOfAKind = cardRanks.filter((rank) => cardRanks.filter((r) => r === rank).length === 4)

        this.finalCards = this.sortedCards.filter(card => card.nominalValue === fourOfAKind[0])
        this.finalCards = this.finalCards.concat(this.nextHighest().slice(0, this.rules.requiredCards - 4));
    }
}

class FullHouse extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'Full House', rules)
    }

    evaluate() {
        return this.hasNOfAKind(3) && this.hasNOfAKind(2);
    }

    setFinalCards() {
        const cardRanks = this.sortedCards.map((card) => card.nominalValue);
        const threeOfAKind = cardRanks.filter((rank) => cardRanks.filter((r) => r === rank).length === 3)
        const pair = cardRanks.filter((rank) => cardRanks.filter((r) => r === rank).length === 2)

        this.finalCards = this.sortedCards.filter(card => card.nominalValue === threeOfAKind[0])
        this.finalCards = this.finalCards.concat(this.sortedCards.filter(card => card.nominalValue === pair[0]));
    }
}

class Flush extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'Flush', rules);
    }

    evaluate() {
        const suit = this.originalCards[0].suit.name;

        return this.originalCards.every((card) => card.suit.name === suit);
    }
}

class Straight extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'Straight', rules);
    }

    evaluate() {
        const cardRanks = this.sortedCards.map((card) => card.nominalValue);
        this.finalCards = this.sortedCards;

        // Check for A-2-3-4-5 straight
        if (
            cardRanks[0] === CardValues.A &&
            cardRanks[1] === CardValues[5] &&
            cardRanks[2] === CardValues[4] &&
            cardRanks[3] === CardValues[3] &&
            cardRanks[4] === CardValues[2]
        ) {
            return true;
        }

        return new Set(cardRanks).size === 5 && Math.max(...cardRanks) - Math.min(...cardRanks) === 4;
    }
}

class ThreeOfAKind extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'Three of a Kind', rules)
    }

    evaluate() {
        return this.hasNOfAKind(3);
    }

    setFinalCards() {
        const cardRanks = this.sortedCards.map((card) => card.nominalValue);
        const threeOfAKind = cardRanks.filter((rank) => cardRanks.filter((r) => r === rank).length === 3)

        this.finalCards = this.sortedCards.filter(card => card.nominalValue === threeOfAKind[0])
        this.finalCards = this.finalCards.concat(this.nextHighest().slice(0, this.rules.requiredCards - 3));
    }
}

class TwoPair extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'Two Pair', rules)
    }

    evaluate() {
        const cardRanks = this.sortedCards.map((card) => card.nominalValue);
        const uniqueRanks = new Set(cardRanks);

        return (
            uniqueRanks.size === 3 &&
            [...uniqueRanks].filter((rank) => cardRanks.filter((r) => r === rank).length === 2).length === 2
        );
    }

    setFinalCards() {
        const cardRanks = this.sortedCards.map((card) => card.nominalValue);
        const uniqueRanks = new Set(cardRanks);

        const twoPair = [...uniqueRanks].filter((rank) => cardRanks.filter((r) => r === rank).length === 2)
        this.finalCards = this.sortedCards.filter(card => card.nominalValue === Math.max(...twoPair))
        this.finalCards = this.finalCards.concat(this.sortedCards.filter(card => card.nominalValue === Math.min(...twoPair)))
        this.finalCards = this.finalCards.concat(this.nextHighest().slice(0, this.rules.requiredCards - 4));
    }
}

class OnePair extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'One Pair', rules)
    }

    evaluate() {
        return this.hasNOfAKind(2);
    }

    setFinalCards() {
        const cardRanks = this.sortedCards.map((card) => card.nominalValue);
        const pair = cardRanks.filter((rank) => cardRanks.filter((r) => r === rank).length === 2)

        this.finalCards = this.sortedCards.filter(card => card.nominalValue === pair[0])
        this.finalCards = this.finalCards.concat(this.nextHighest().slice(0, this.rules.requiredCards - 2));
    }
}

class HighCard extends Ranker2 {
    constructor(cards, rules) {
        super(cards, 'High Card', rules)
    }

    evaluate() {
        return true;
    }
}

const gameRules = {
    head: {
        name: 'Head',
        requiredCards: 3,
        ranking: [ThreeOfAKind, OnePair, HighCard]
    },
    body: {
        name: 'Body',
        requiredCards: 5,
        ranking: [RoyalFlush, StraightFlush, FourOfAKind, FullHouse, Flush, Straight, ThreeOfAKind, TwoPair, OnePair, HighCard]
    },
    tail: {
        name: 'Tail',
        requiredCards: 5,
        ranking: [RoyalFlush, StraightFlush, FourOfAKind, FullHouse, Flush, Straight, ThreeOfAKind, TwoPair, OnePair, HighCard]
    }
}
