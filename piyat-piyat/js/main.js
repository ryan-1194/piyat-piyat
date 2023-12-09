const { createApp, ref, provide } = Vue

const app = createApp({
    setup() {
        const message = ref('Hello vue!')
        const game = ref(new Game())
        game.value.setup();
        // game.value.calculatePlayerPoints();
        // game.value.displayPlayerHands();

        // console.log(game.value)
        //
        console.log(
            Ranker2.evaluate([
                new Card(6, CardSuits.HEART),
                new Card(6, CardSuits.SPADES),
                new Card(5, CardSuits.DIAMONDS),
                new Card(5, CardSuits.HEART),
                new Card(3, CardSuits.HEART),
            ], gameRules.body).loseTo(
                Ranker2.evaluate([
                    new Card(4, CardSuits.HEART),
                    new Card(4, CardSuits.SPADES),
                    new Card(4, CardSuits.DIAMONDS),
                    new Card(5, CardSuits.HEART),
                    new Card(3, CardSuits.HEART),
                ], gameRules.body)
            )
        )
        console.log(
            Ranker2.evaluate([
                new Card(6, CardSuits.HEART),
                new Card(6, CardSuits.SPADES),
                new Card(5, CardSuits.DIAMONDS),
                new Card(5, CardSuits.HEART),
                new Card(3, CardSuits.HEART),
            ], gameRules.body)
        )

        console.log(
            Ranker2.evaluate([
                new Card(6, CardSuits.HEART),
                new Card(6, CardSuits.SPADES),
                new Card(5, CardSuits.DIAMONDS),
                new Card(5, CardSuits.HEART),
                new Card(3, CardSuits.HEART),
            ], gameRules.body).calculatePoints(
                Ranker2.evaluate([
                    new Card(4, CardSuits.HEART),
                    new Card(4, CardSuits.SPADES),
                    new Card(4, CardSuits.DIAMONDS),
                    new Card(5, CardSuits.HEART),
                    new Card(3, CardSuits.HEART),
                ], gameRules.body),

                Ranker2.evaluate([
                    new Card(4, CardSuits.HEART),
                    new Card(4, CardSuits.SPADES),
                    new Card(4, CardSuits.DIAMONDS),
                    new Card(5, CardSuits.HEART),
                    new Card(3, CardSuits.HEART),
                ], gameRules.body),

                Ranker2.evaluate([
                    new Card(6, CardSuits.HEART),
                    new Card(6, CardSuits.SPADES),
                    new Card(5, CardSuits.DIAMONDS),
                    new Card(5, CardSuits.HEART),
                    new Card(3, CardSuits.HEART),
                ], gameRules.body)
            )
        )
        provide('game', game); // Provide the game data

        return {
            Hand,
            Ranker2,
            gameRules,
            message,
            game
        }
    }
})

// Register the Card component globally
// app.component('playing-card', PlayingCard);

app.component('playing-card', {
    props: ['value', 'suit', 'owner', 'card'],
    inject: ['game'], // Inject the game data
    data() {
        return {
            draggable: true
        };
    },
    methods: {
        dragStart(event) {
            event.dataTransfer.setData('text/plain', JSON.stringify({ owner: this.owner, value: this.value, suit: this.suit }));
        },
        drop(event, owner, value, suit) {
            const draggedCard = JSON.parse(event.dataTransfer.getData('text/plain'));
            const draggedCardOwner = this.game.findPlayer(draggedCard.owner.id)
            const draggedCardPosition = draggedCardOwner.findCard({
                value: draggedCard.value,
                suit: draggedCard.suit.name
            })
            const droppedCardPosition = owner.findCard({
                value: value,
                suit: suit.name
            })

            if(owner.id !== draggedCardOwner.id && !this.game.allowPlayerSwapCards) {
                return alert('No cheating!')
            }

            this.game.swapCards(draggedCardOwner, draggedCardPosition.section, draggedCardPosition.index, owner, droppedCardPosition.section, droppedCardPosition.index)
        }
    },
    mounted() {
        // console.log(this.card)
    },
    template: `
        <div class="playing-card" :draggable="draggable" @dragstart="dragStart" @drop="drop($event, owner, value, suit)" @dragover.prevent>
            <div class="border border-gray-100 rounded-md shadow-md bg-white p-2 w-24 h-32 flex flex-col justify-between" :class="suit.color, card.cardAnimationClass">
                <div class="relative flex flex-col space-y-1">
                    <span class="text-2xl font-bold">{{ value }}</span>
                    <span class="absolute top-5" v-html="suit.htmlEntity"></span>
                </div>
                <div class="flex justify-end">
                    <span class="text-7xl" v-html="suit.htmlEntity"></span>
                </div>
            </div>
        </div>
       `
});

app.mount('#app')
