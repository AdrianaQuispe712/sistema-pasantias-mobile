import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@auth_token";
const USER_KEY = "@auth_user";

/**
 * Token Storage - Persistencia de sesión con AsyncStorage
 *
 * Por qué AsyncStorage y no SecureStore?
 * - SecureStore tiene un límite de 2KB por item
 * - El objeto user completo puede exceder eso
 * - Para una app de pasantías, AsyncStorage es suficiente
 * - Si necesitás más seguridad, migrá a expo-secure-store
 */

export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Error guardando token:", error);
    throw error;
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error obteniendo token:", error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error eliminando token:", error);
  }
};

export const saveUser = async (user) => {
  try {
    const jsonValue = JSON.stringify(user);
    await AsyncStorage.setItem(USER_KEY, jsonValue);
  } catch (error) {
    console.error("Error guardando usuario:", error);
    throw error;
  }
};

export const getUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return null;
  }
};

export const removeUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Error eliminando usuario:", error);
  }
};

export const clearAll = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error("Error limpiando storage:", error);
  }
};
