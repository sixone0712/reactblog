import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';
import { createRquestActionTypes } from '../lib/createRequestSaga';

const CHANGE_FIELD = 'auth/CHANGE_FIELD';
const INITIALIZE_FORM = 'auth/INITIALIZE_FORM';

const [REGSITER, REGSITER_SUCCESS, REGSITER_FAILURE] = createRquestActionTypes(
  'auth/REGISTER',
);

const [LOGIN, LOGIN_SUCCESS, LOGIN_FAILURE] = createRquestActionTypes(
  'auth/LOGIN',
);

export const changeField = createAction(
  CHANGE_FIELD,
  ({ form, key, value }) => ({
    form, // register, login
    key, // uaername, password, passwordConfirm
    value, // 실제 바꾸려는 값
  }),
);

export const initializeForm = createAction(INITIALIZE_FORM, (form) => form); // register, login

const initialState = {
  register: {
    username: '',
    password: '',
    passwordConfirm: '',
  },
  login: {
    username: '',
    password: '',
  },
};

const auth = handleActions(
  {
    [CHANGE_FIELD]: (state, { payload: { form, key, value } }) => {
      console.log('state', state);
      console.log('form', form);
      console.log('key', key);
      console.log('value', value);
      return produce(state, (draft) => {
        console.log('draft', draft);
        draft[form][key] = value; // 예: state.register.username을 바꾼다.
      });
    },
    [INITIALIZE_FORM]: (state, { payload: form }) =>
      produce(state, (draft) => {
        draft[form] = initialState[form];
      }),
  },
  initialState,
);

export default auth;
