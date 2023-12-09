class Hand {
    constructor(head, body, tail, name) {
        this.head = head
        this.body = body
        this.tail = tail
        this.cards = this.head.concat([...this.body, ...this.tail])
        this.name = name

        this.isPossible = this.evaluate()
    }

    static evaluate(head, body, tail) {
        let ranking = handRules.ranking;
        let result = null;

        for (let i= 0; i < ranking.length; i++) {
            result = new ranking[i](head, body, tail);
            if (result.isPossible) {
                break;
            }
        }

        return result;
    }
}

class Dragon extends Hand {
    constructor(head, body, tail) {
        super(head, body, tail, "Dragon");
    }

    evaluate() {
        return new Set(this.cards.map(card => card.nominalValue)).size === handRules.requiredCards
    }
}

class TwoToNine extends Hand{
    constructor(head, body, tail) {
        super(head, body, tail, "Two to Nine");
    }

    evaluate() {
        return Math.max(...this.cards.map(card => card.nominalValue)) === 9
    }
}

class ThreeFlushes extends Hand {
    constructor(head, body, tail) {
        super(head, body, tail, "Three Flushes");
    }

    evaluate() {
        const bodyRank = Ranker2.evaluate(this.body, gameRules.body)
        const bodyIsFlush = bodyRank instanceof Flush || bodyRank instanceof StraightFlush
        const tailRank =  Ranker2.evaluate(this.tail, gameRules.tail)
        const tailIsFlush = tailRank instanceof Flush || tailRank instanceof Flush

        return this.headIsFlush() && bodyIsFlush && tailIsFlush
    }

    headIsFlush() {
        const headSuit = this.head[0].suit.name;

        return  this.head.every((card) => card.suit.name === headSuit);
    }
}

class ThreeStraights extends Hand {
    constructor(head, body, tail) {
        super(head, body, tail, "Three Straights");
    }

    evaluate() {
        const bodyIsStraight = Ranker2.evaluate(this.body, gameRules.body) instanceof Straight
        const tailIsStraight = Ranker2.evaluate(this.tail, gameRules.tail) instanceof Straight

        return this.headIsStraight() && bodyIsStraight && tailIsStraight
    }

    headIsStraight () {
        const cardRanks = this.head.sort(Card.sort).map((card) => card.nominalValue);

        // Check for A-2-3 straight
        if (
            cardRanks[0] === CardValues.A &&
            cardRanks[1] === CardValues[3] &&
            cardRanks[2] === CardValues[2]
        ) {
            return true;
        }

        return new Set(cardRanks).size === 3 && Math.max(...cardRanks) - Math.min(...cardRanks) === 2;
    }
}

class SixPairs extends Hand {
    constructor(head, body, tail) {
        super(head, body, tail, "Six Pairs");
    }

    evaluate() {
        const cardRanks = this.cards.map((card) => card.nominalValue);
        const uniqueRanks = new Set(cardRanks);

        return (
            uniqueRanks.size === 7 &&
            [...uniqueRanks].filter((rank) => cardRanks.filter((r) => r === rank).length === 2).length === 6
        );
    }
}

class StraightFlushHand extends Hand {
    constructor(head, body, tail) {
        super(head, body, tail, "Straight Flush");
    }

    evaluate() {
        const rank = Ranker2.evaluate(this.tail, gameRules.tail);
        return rank instanceof StraightFlush || rank instanceof RoyalFlush
    }
}

class FourOfAKindHand extends Hand {
    constructor(head, body, tail) {
        super(head, body, tail, "Four of a Kind");
    }

    evaluate() {
        return Ranker2.evaluate(this.tail, gameRules.tail) instanceof FourOfAKind
    }
}

class Normal extends Hand {
    constructor(head, body, tail) {
        super(head, body, tail, "Normal");
    }

    evaluate() {
        return true
    }
}

const handRules = {
    requiredCards: 13,
    ranking: [Dragon, TwoToNine, ThreeFlushes, ThreeStraights, SixPairs, StraightFlushHand, FourOfAKindHand, Normal]
}
