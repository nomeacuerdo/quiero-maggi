/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import {
  readDataPromise,
  removeFromWanted,
  SIGNIN_PROVIDERS,
  signInWithProvider,
  signOut,
} from './config/firebase';
import './App.css';

import { ReactComponent as UserIcon } from './assets/user.svg';
import { ReactComponent as Localstorage } from './assets/localstorage.svg';
import { ReactComponent as Save } from './assets/save.svg';
import { ReactComponent as Shipping } from './assets/shipping.svg';

import useLocalStorage from './utils/useLocalStorage';

const endpoint = 'https://api.scryfall.com';

const App = () => {
  const [user, setUser] = useState(null);
  const [cardList, setCardList] = useState([]);
  const [fetchNeed, setFetchNeed] = useState(false);
  const [savedCardData, setSavedCardData] = useLocalStorage('savedCardData', []);
  const [gotCards, setGotCards] = useLocalStorage('gotCards', []);

  const handleLogin = () => {
    const userBoy = signInWithProvider(SIGNIN_PROVIDERS.GOOGLE);
    userBoy.then((data) => {
      setUser(data.user);
    });
  };
  
  const handleLogout = () => {
    const userBoy = signOut();
    userBoy.then((data) => {
      setUser(null);
    });
  };

  const gotACard = (id) => {
    setGotCards([...gotCards, id]);
  };

  const commitChanges = () => {
    if(gotCards.length > 0) {
      setGotCards([]);
      removeFromWanted(gotCards, 'gotCards');
      setTimeout(() => setFetchNeed(!fetchNeed), 1000);
    }
  };

  const gotOnline = () => {
    if(gotCards.length > 0) {
      setGotCards([]);
      removeFromWanted(gotCards, 'onlineCards');
      setTimeout(() => setFetchNeed(!fetchNeed), 1000);
    }
  };

  const lostACard = (id) => {
    const filtered = gotCards.filter(item => item !== id);
    setGotCards(filtered);
  }

  const clearLocalstorage = () => {
    setSavedCardData([]);
    setGotCards([]);
    setFetchNeed(!fetchNeed);
  };

  useEffect(async () => {
    const fetchCardData = async (requestList) => {
      const requests = await Promise.allSettled(requestList);  
      const datas = requests.map((item) => item.value?.data);
      setSavedCardData(datas);
      console.info('Scryfall fetch');
    };

    await readDataPromise().then((dataObject) => {
      const data = Object.keys(dataObject).map((k) => dataObject[k]);
      data.sort((a, b) => b.order - a.order);

      setCardList(data.reverse());
      const SearchCardList = data.reduce((acc, item) => (item.cards ? [...acc, ...item.cards] : acc), []);

      if (SearchCardList && (savedCardData.length === 0 || SearchCardList.length !== savedCardData.length)) {
        const promiseList = SearchCardList.map((id) => axios.get(`${endpoint}/cards/${id}`));
        fetchCardData(promiseList);
      }
    });
  }, [fetchNeed]);

  const getCard = (id) => savedCardData.filter((item) => item?.scryfall_uri.includes(id))[0];
  const getArt = (object) => object?.image_uris?.small || object?.card_faces[0]?.image_uris?.small;
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
                  ? item.cards?.map((i) =>
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
                <small>{i}</small>
              </div>
            ))
          }
        </div>
      </div>
      <div className="button-list">
        {
          !user && (
            <button className='user-icon' onClick={handleLogin}>
              <UserIcon />
            </button>
          )
        }
        {
          user?.email === 'nomeacuerdo@gmail.com' && (
            <>
              <button className='user-icon' onClick={commitChanges}>
                <Save /> Save on Got Cards
              </button>
              <button className='user-icon' onClick={gotOnline}>
                <Shipping /> Ordered online, awaiting arrival
              </button>
              <button className='user-icon' onClick={clearLocalstorage}>
                <Localstorage /> Clear Local Storage
              </button>
              <button className='user-icon' onClick={handleLogout}>
                <UserIcon /> Logout
              </button>
            </>
          )
        }
        {
          user && user?.email !== 'nomeacuerdo@gmail.com' && (
              <button onClick={handleLogout}>
                Largo de aqui
              </button>
            )
        }
      </div>
    </div>
  );
};

export default App;
