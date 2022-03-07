import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, child, get } from "firebase/database";
import {
  fetchSignInMethodsForEmail,
  getAuth,
  linkWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  TwitterAuthProvider,
} from "firebase/auth";

import config from './.config';

const firebaseConfig = config;

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase();

// Database functions

const writeData = (cardId) => {
  set(ref(db, `gotCards/${cardId}`), cardId);
};

const readDataPromise = () => {
  const dbRef = ref(db);
  return get(child(dbRef, 'needCards/data')).then(async (snapshot) => {
    if (snapshot.exists()) {
      return await snapshot.val();
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
  })
};

const removeFromWanted = (cardArray) => {
  cardArray.map((cardId) => writeData(cardId));
  readDataPromise().then((data) => {
    const filteredData = data.map((item) => {
      const filteredCards = item.cards?.filter((i) => !cardArray.includes(i));
      const newItem = { ...item, cards: filteredCards || [] };
      return newItem;
    });
    set(ref(db, `needCards/data`), filteredData);
  });
};

// Auth functions
const SIGNIN_PROVIDERS = {
  PASSWORD: "password",
  GOOGLE: "google",
  FACEBOOK: "facebook",
  TWITTER: "twitter",
  GITHUB: "github",
  MICROSOFT: "microsoft",
  YAHOO: "yahoo",
};

const signInWithProvider = async (provider, options) => {
  const auth = getAuth(firebaseApp);
  // setState({ loading: true });
  
  let providerObj;
  if (typeof provider === "string") {
    switch (provider) {
      case SIGNIN_PROVIDERS.GOOGLE:
        providerObj = new GoogleAuthProvider();
        break;

      case SIGNIN_PROVIDERS.FACEBOOK:
        providerObj = new FacebookAuthProvider();
        break;

      case SIGNIN_PROVIDERS.TWITTER:
        providerObj = new TwitterAuthProvider();
        break;

      case SIGNIN_PROVIDERS.GITHUB:
        providerObj = new GithubAuthProvider();
        break;

      case SIGNIN_PROVIDERS.MICROSOFT:
        providerObj = new OAuthProvider("microsoft.com");
        break;

      case SIGNIN_PROVIDERS.YAHOO:
        providerObj = new OAuthProvider("yahoo.com");
        break;

      default:
        throw new Error(`Unrecognized provider: ${provider}`);
    }
  } else {
    providerObj = provider;
  }

  const scopes = options && Array.isArray(options.scopes) ? options.scopes : [];

  if (provider instanceof OAuthProvider) {
    scopes.forEach(scope => (providerObj).addScope(scope));
  }

  try {
    const userCredential = await signInWithPopup(auth, providerObj);
    return userCredential;
  } catch (e) {
    if ( e.email && e.credential && e.code === "auth/account-exists-with-different-credential") {
      const supportedPopupSignInMethods = [
        GoogleAuthProvider.PROVIDER_ID,
        FacebookAuthProvider.PROVIDER_ID,
        GithubAuthProvider.PROVIDER_ID,
      ];

      const getProvider = (providerId) => {
        switch (providerId) {
          case GoogleAuthProvider.PROVIDER_ID:
            return new GoogleAuthProvider();
          case FacebookAuthProvider.PROVIDER_ID:
            return new FacebookAuthProvider();
          case GithubAuthProvider.PROVIDER_ID:
            return new GithubAuthProvider();
          default:
            throw new Error(`No provider implemented for ${providerId}`);
        }
      }

      const providers = await fetchSignInMethodsForEmail(auth, e.email);
      const firstPopupProviderMethod = providers.find((p) =>
        supportedPopupSignInMethods.includes(p),
      );

      if (!firstPopupProviderMethod) {
        throw new Error(
          `Your account is linked to a provider that isn't supported.`,
        );
      }

      const linkedProvider = getProvider(firstPopupProviderMethod);
      linkedProvider.setCustomParameters({ login_hint: e.email });

      const result = await signInWithPopup(auth, linkedProvider);
      result.user && linkWithCredential(result.user, e.credential);
    } else {
      // setState({
      //   error: e,
      //   loading: false,
      // })
    }
    return null;
  }
};

const signOut = async () => firebaseSignOut(auth);

const getFirebaseUser = () => auth.currentUser;

export { 
  writeData,
  readDataPromise,
  removeFromWanted,
  SIGNIN_PROVIDERS,
  getFirebaseUser,
  signInWithProvider,
  signOut,
};
