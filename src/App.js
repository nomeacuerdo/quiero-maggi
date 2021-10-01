/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import axios from 'axios';

import './App.css';

import useLocalStorage from './utils/useLocalStorage';
import cardList from './cardlist.json';

const endpoint = 'https://api.scryfall.com';

const App = () => {
  const [savedCardData, setSavedCardData] = useLocalStorage('savedCardData', []);
  const [gotCards, setGotCards] = useLocalStorage('gotCards', []);

  const gotACard = (id) => {
    setGotCards([...gotCards, id]);
  };

  const lostACard = (id) => {
    const filtered = gotCards.filter(item => item !== id);
    setGotCards(filtered);
  }

  useEffect(() => {
    const fetchCardData = async (requestList) => {
      const requests = await Promise.allSettled(requestList);
  
      const datas = requests.map((item) => item.value?.data);
      setSavedCardData(datas);
    };

    if (savedCardData.length === 0) {
      const urlList = [];
      cardList.map((item) => item.cards.map((id) => urlList.push(axios.get(`${endpoint}/cards/${id}`))));
      fetchCardData(urlList);
    }
  }, []);

  const getCard = (id) => savedCardData.filter((item) => item?.scryfall_uri.includes(id))[0];

  const getArt = (object) => object?.image_uris.small;
  const getTitle = (object) => object?.name;
  const getExp = (object) => object?.set_name;
  const getPrice = (object) => object?.prices.usd;
  const isToken = (object) => object?.set_type === "token";

  return (
    <div className="container">
      {
        cardList.map((item) => (
          <div key={item.id} className="section">
            <h2>{item.title}</h2>
            <div className="card-list">
              {
                savedCardData.length > 0
                  ? item.cards.map((i) =>
                    !gotCards.includes(i)
                      ? (
                        <div key={i} data-code={i} className="card" onClick={() => gotACard(i)}>
                          <img src={getArt(getCard(i))} alt={getTitle(getCard(i))} />
                          <div className="title">{getTitle(getCard(i))}</div>
                          {
                            isToken(getCard(i))
                            ? (
                              <div className="exp">{getExp(getCard(i))}</div>
                            )
                            : null
                          }
                          <small>TCG: {getPrice(getCard(i))}</small>
                        </div>
                      )
                      : null
                  )
                  : null
              }
            </div>
          </div>
        ))
      }
      <div className="section got">
        <h2>Ya consegui</h2>
        <div className="card-list">
          {
            gotCards.map((i) => (
              <div key={i} data-code={i} className="card" onClick={() => lostACard(i)}>
                <img src={getArt(getCard(i))} alt={getTitle(getCard(i))} />
                <div className="title">{getTitle(getCard(i))}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default App;
