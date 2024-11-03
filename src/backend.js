import bridge from '@vkontakte/vk-bridge';

class Backend {
    constructor() {
        this.balance = 0;
        this.clickPower = 1;
        this.passiveIncome = 0;
        this.lastClickTime = 0;
        this.upgradeCosts = {
          clickPowerOne: 100,
          passiveIncomeOne: 100,
          clickPowerTwo: 200,
          passiveIncomeTwo: 200,
          clickPowerThr: 500,
          passiveIncomeThr: 500,
          clickPowerFive: 1000,
          passiveIncomeFive: 1000,
        };
        this.upgradeInfo = {
          clickPowerOne: { type: 'clickPower', increment: 1 },
          passiveIncomeOne: { type: 'passiveIncome', increment: 1 },
          clickPowerTwo: { type: 'clickPower', increment: 2 },
          passiveIncomeTwo: { type: 'passiveIncome', increment: 2 },
          clickPowerThr: { type: 'clickPower', increment: 3 },
          passiveIncomeThr: { type: 'passiveIncome', increment: 3 },
          clickPowerFive: { type: 'clickPower', increment: 5 },
          passiveIncomeFive: { type: 'passiveIncome', increment: 5 },
        };
      }

      async init() {
        const userInfo = await bridge.send('VKWebAppGetUserInfo');
        this.userId = userInfo.id;
      }

      async loadUserData() {
        if (!this.userId) await this.init();
        
        const keys = [
        `user_${this.userId}_balance`,
        `user_${this.userId}_clickPower`,
        `user_${this.userId}_passiveIncome`,
        ...Object.keys(this.upgradeCosts).map(key => `user_${this.userId}_${key}`)
        ];
        const { keys: storageKeys } = await bridge.send('VKWebAppStorageGet', { keys });
        this.balance = Number(storageKeys.find(k => k.key === `user_${this.userId}_balance`)?.value) || 0;
        this.clickPower = Number(storageKeys.find(k => k.key === `user_${this.userId}_clickPower`)?.value) || 1;
        this.passiveIncome = Number(storageKeys.find(k => k.key === `user_${this.userId}_passiveIncome`)?.value) || 0;
        for (const key in this.upgradeCosts) {
            this.upgradeCosts[key] = Number(storageKeys.find(k => k.key === `user_${this.userId}_${key}`)?.value) || this.upgradeCosts[key];
        }
        
        return {
            balance: this.balance,
            clickPower: this.clickPower,
            passiveIncome: this.passiveIncome,
            upgradeCosts: this.upgradeCosts,
        };
      }
      

      async saveUserData() {
        if (!this.userId) await this.init(); // Убедитесь, что userId инициализирован
      
        const dataToSave = [
          { key: `user_${this.userId}_balance`, value: String(this.balance) },
          { key: `user_${this.userId}_clickPower`, value: String(this.clickPower) },
          { key: `user_${this.userId}_passiveIncome`, value: String(this.passiveIncome) },
          ...Object.keys(this.upgradeCosts).map(key => ({
            key: `user_${this.userId}_${key}`,
            value: String(this.upgradeCosts[key])
          }))
        ];
      
        await Promise.all(dataToSave.map(data => bridge.send('VKWebAppStorageSet', data)));
      }
      
      

  handleTap() {
    const now = Date.now();
    if (now - this.lastClickTime >= 10) {
      this.balance += this.clickPower;
      this.lastClickTime = now;
      this.saveUserData(); // Сохранение после обновления баланса
      return { success: true, balance: this.balance };
    } else {
      return { success: false, message: 'Кликать можно раз в 0.1 секунду' };
    }
  }

  async handleShowAdBack() {
    const adResponse = await bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' });
    if (adResponse.result) {
      await bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
      this.balance *= 2; // Удвоение баланса
      this.saveUserData(); // Сохранение после обновления баланса
      return { success: true, balance: this.balance };
    } else {
      return { success: false, message: 'Реклама недоступна' };
    }
  }

  purchaseUpgrade(upgradeType) {
    const cost = this.upgradeCosts[upgradeType];
    
    if (this.balance >= cost) {
      this.balance -= cost;
      const upgrade = this.upgradeInfo[upgradeType];
      if (upgrade.type === 'clickPower') {
        this.clickPower += upgrade.increment;
      } else if (upgrade.type === 'passiveIncome') {
        this.passiveIncome += upgrade.increment;
      }
      if (upgrade.increment == 1) {
        this.upgradeCosts[upgradeType] = Math.ceil(cost * 1.5);
      } else if (upgrade.increment == 2){
        this.upgradeCosts[upgradeType] = Math.ceil(cost * 2);
      } else if (upgrade.increment == 3){
        this.upgradeCosts[upgradeType] = Math.ceil(cost * 2.5);
      } else if (upgrade.increment == 5){
        this.upgradeCosts[upgradeType] = Math.ceil(cost * 3);
      }

      this.saveUserData();

      return {
        success: true,
        balance: this.balance,
        clickPower: this.clickPower,
        passiveIncome: this.passiveIncome,
        newCost: this.upgradeCosts[upgradeType],
      };
    } else {
      return { success: false, message: 'Недостаточно монет' };
    }
  }
  
  
}

export default new Backend();
