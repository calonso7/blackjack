import React, { Component } from 'react';
import { Button, Card } from 'react-bootstrap';
import './App.css';

const aceCodes = ["AC", "AS", "AH", "AD"]

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerCards: [],
      houseCards: [],
      deckId: null,
      gameStarted: false,
      houseScore: 0,
      playerScore: 0
    }
  }


  async hit() {
    const cardsDrawn = await this.drawCard(1, this.state.deckId)
    const firstDrawn = cardsDrawn[0]
    this.setState({
      ...this.state,
      playerCards: [...this.state.playerCards, {
        img: firstDrawn.image, code: firstDrawn.code, value: firstDrawn.value
      }
      ]
    }, () => this.evaluateScores(false))
  }

  async drawCard(count, deckId) {
    const url = "https://deckofcardsapi.com/api/deck/" + deckId + "/draw/?count=" + count;
    const response = await fetch(url)
    var json = await response.json()
    return this.mapValues(json.cards)
  }

  mapValues(cards) {
    cards = cards.map(card => {
      var value = card.value
      if (aceCodes.includes(card.code)) {
        value = 1
      } else if (!parseInt(card.value)) {
        value = 10
      }

      return {
        ...card,
        value: parseInt(value)
      }
    })
    return cards
  }

  async startGame() {
    // create deck if doesn't already exist & shuffle cards
    var currDeckId = this.state.deckId
    if (!currDeckId) {
      const url = "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1";
      const responseBody = await (await fetch(url)).json()
      currDeckId = responseBody?.deck_id
    } else {
      // return cards from previous hand to deck
      let url = "https://deckofcardsapi.com/api/deck/" + currDeckId + "/return/"
      await fetch(url)
      // reshuffle deck
      url = "https://deckofcardsapi.com/api/deck/" + currDeckId + "/shuffle/"
      await fetch(url)
    }

    // Draw 2 initial Cards for house & player
    const cardsDrawn = await this.drawCard(4, currDeckId)
    const firstDrawn = cardsDrawn[0]
    const secondDrawn = cardsDrawn[1]
    const thirdDrawn = cardsDrawn[2]
    const fourthDrawn = cardsDrawn[3]
    this.setState({
      ...this.state,
      deckId: currDeckId,
      gameStarted: true,
      endGameResult: "",
      houseCards: [...this.state.houseCards,
      { img: firstDrawn.image, code: firstDrawn.code, value: firstDrawn.value },
      { img: secondDrawn.image, code: secondDrawn.code, value: secondDrawn.value }],
      playerCards: [...this.state.playerCards,
      { img: thirdDrawn.image, code: thirdDrawn.code, value: thirdDrawn.value },
      { img: fourthDrawn.image, code: fourthDrawn.code, value: fourthDrawn.value }]
    }, () => this.evaluateScores(false))

  }

  evaluateScores(isStand) {
    // recalc scores and end game if necessary

    // Sort cards to ensure aces are counted at the end
    this.state.playerCards.sort(function (a, b) { return b.value - a.value })
    this.state.houseCards.sort(function (a, b) { return b.value - a.value })

    // Calc Player Score
    var playerCount = 0;
    this.state.playerCards.forEach((card, idx, array) => {
      if (!aceCodes.includes(card.code)) {
        playerCount = playerCount + card.value
      } else {
        if ((idx == array.length - 1) && (playerCount + 11 <= 21)) {
          // only value last ACE in list as 11 since can't have more than 1 ace as 11 and be <21
          playerCount = playerCount + 11
        } else {
          playerCount++;
        }
      }
    })

    // Calc House Score
    var houseCount = 0
    this.state.houseCards.forEach((card, idx, array) => {
      if (!aceCodes.includes(card.code)) {
        houseCount = houseCount + card.value
      } else {
        if ((idx == array.length - 1) && (houseCount + 11 <= 21)) {
          houseCount = houseCount + 11
        } else {
          houseCount++;
        }
      }
    })

    this.setState({
      ...this.state,
      houseScore: houseCount,
      playerScore: playerCount
    }, () => {
      if (playerCount > 21 || isStand) {
        this.determineWinner(houseCount, playerCount)
      }
    })


  }


  determineWinner(houseCount, playerCount) {
    var endGameResult = ""
    if (playerCount > houseCount && playerCount <= 21) {
      endGameResult = "You win!"
    }
    else {
      endGameResult = "House wins!"
    }

    this.setState({
      ...this.state,
      playerCards: [],
      houseCards: [],
      gameStarted: false,
      endGameResult: endGameResult
    })
  }

  render() {
    return (
      <div className="game">
        <div className="gameBoard">
          <div className="cardSection">
            {this.state.houseCards.map((card) => (
              <Card className="card">
                <img className="cardImage" src={card.img}></img>
              </Card>
            ))}
          </div>
          <div className="gameButtons">
            {this.state.gameStarted && <Button className="gameButton" onClick={() => this.hit()}>HIT</Button>}
            <div>
              {!this.state.gameStarted && <h1>{this.state.endGameResult}</h1>}
              {!this.state.gameStarted && <Button className="dealButton" onClick={() => this.startGame()}>Deal</Button>}
            </div>
            {this.state.gameStarted && <Button className="gameButton" onClick={() => this.evaluateScores(true)}>STAND</Button>}
          </div>
          <div className="cardSection">
            {this.state.playerCards.map((card) => (
              <Card className="card">
                <img src={card.img} className="cardImage"></img>
              </Card>
            ))}
          </div>
        </div>
        <div className="scoreBoard">
          <h2 className="score">Dealer: {this.state.houseScore} points</h2>
          <h2 className="score">You: {this.state.playerScore} points</h2>
        </div>
      </div>
    );
  }

}
export default App;