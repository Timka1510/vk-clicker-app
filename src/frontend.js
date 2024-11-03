import React, { useEffect, useState } from 'react';
import { Panel, PanelHeader, Tabbar, TabbarItem, View, SplitLayout, SplitCol, Group, FixedLayout, Div, Snackbar, Card, CardGrid } from '@vkontakte/vkui';
import { Icon28MarketOutline, Icon28MoneyCircleOutline, Icon16Done, Icon16Cancel } from '@vkontakte/icons';
import Backend from './backend';
import './App.css';

function App() {
  const [activePanel, setActivePanel] = useState('clicker');
  const [balance, setBalance] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [snackbar, setSnackbar] = useState(null); // Для показа уведомлений
  const [upgradeCosts, setUpgradeCosts] = useState({
    clickPowerOne: 100,
    passiveIncomeOne: 100,
    clickPowerTwo: 200,
    passiveIncomeTwo: 200,
    clickPowerThr: 500,
    passiveIncomeThr: 500,
    clickPowerFive: 1000,
    passiveIncomeFive: 1000,
  });
  
  useEffect(() => {
    const initializeBackend = async () => {
      await Backend.init(); 
      const userData = await Backend.loadUserData();
      setBalance(userData.balance);
      setClickPower(userData.clickPower);
      setPassiveIncome(userData.passiveIncome);
      setUpgradeCosts(userData.upgradeCosts);
    };
  
    initializeBackend();
  }, []);
  

  useEffect(() => {
    const interval = setInterval(() => {
      setBalance(prevBalance => {
        const newBalance = prevBalance + passiveIncome;
        Backend.balance = newBalance;
        Backend.saveUserData();
        return newBalance;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [passiveIncome]);

  const handleCatClick = () => {
    const result = Backend.handleTap();
    if (result.success) {
      setBalance(result.balance);
    } else {
      showSnackbar(result.message, false);
    }
  };

  const handleShowAd = async () => {
    const result = await Backend.handleShowAdBack();
    if (result.success) {
      setBalance(result.balance);
      showSnackbar('Реклама успешно просмотрена. Баланс удвоен.', true);
    } else {
        showSnackbar('Нет доступной рекламы.', false);
    }
  };

  // Показываем уведомление, которое исчезнет через 2 секунды
  const showSnackbar = (message, isSuccess) => {
    setSnackbar(
      <Snackbar
        onClose={() => setSnackbar(null)}
        before={isSuccess ? <Icon16Done fill="var(--vkui--color_icon_positive)" /> : <Icon16Cancel fill="var(--vkui--color_icon_negative)" />}
        duration={500}
      >
        {message}
      </Snackbar>
    );
  };

  const handleUpgrade = (upgradeType) => {
    const result = Backend.purchaseUpgrade(upgradeType);
    if (result.success) {
      setBalance(result.balance);
      setClickPower(result.clickPower);
      setPassiveIncome(result.passiveIncome);
      setUpgradeCosts(prevCosts => ({ ...prevCosts, [upgradeType]: result.newCost }));
      showSnackbar('Улучшение куплено', true);
    } else {
      showSnackbar('Недостаточно средств', false);
    }
  };
  

  return (
    <SplitLayout popout={snackbar}>
      <SplitCol>
        <View activePanel={activePanel}>
          {/* Панель клика */}
          <Panel id="clicker">
          <PanelHeader>Кликер</PanelHeader>
            <Group>
              <Div className="clicker-content">
                <p>Кликай на котика!</p>
                <img src="cat.png" alt="Котик" className="clicker-cat" onClick={handleCatClick} style={{
                    width: 'clamp(170px, 40vw, 270px)',
                    height: 'auto',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                  }}/>
                <p>Баланс: {balance} монет</p>
                <button className="button" onClick={handleShowAd}>Просмотреть рекламу (x2 монет)</button>
              </Div>
            </Group>
          </Panel>

          {/* Панель магазина */}
          <Panel id="shop">
          <PanelHeader>Магазин</PanelHeader>
          <Div className="upgrades-grid">
                {[
                    { name: 'Деловой котик', aboutUp: "+1 к тапу", upgradeType: 'clickPowerOne', image: 'devCat.jpg' },
                    { name: 'Бизнес котик', aboutUp: "+1 монетка/сек", upgradeType: 'passiveIncomeOne', image: 'businessCat.png' },
                    { name: 'Энергичный котик', aboutUp: "+2 к тапу", upgradeType: 'clickPowerTwo', image: 'energyCat.jpg' },
                    { name: 'Умный котик', aboutUp: "+2 монетки/сек", upgradeType: 'passiveIncomeTwo', image: 'smartCat.png' },
                    { name: 'Крутой котик', aboutUp: "+3 к тапу", upgradeType: 'clickPowerThr', image: 'coolCat.png' },
                    { name: 'Толстый котик', aboutUp: "+3 монетки/сек", upgradeType: 'passiveIncomeThr', image: 'fatCat.png' },
                    { name: 'Мудрый котик', aboutUp: "+5 к тапу", upgradeType: 'clickPowerFive', image: 'wiseCat.png' },
                    { name: 'Богатый котик', aboutUp: "+5 монеток/сек", upgradeType: 'passiveIncomeFive', image: 'richCat.png' }
                ].map((item, index) => (
                    <Card key={index} className="upgrade-card" style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'}}>
                    <div className="upgrade-text">
                        <p>{item.name}</p>
                        <p>{item.aboutUp}</p>
                        <p>Стоимость: {upgradeCosts[item.upgradeType]} монет</p>
                    </div>
                    <button className="button" onClick={() => handleUpgrade(item.upgradeType)}>
                        Купить
                    </button>
                    </Card>
                ))}
            </Div>

            
          </Panel>
        </View>

        {/* Нижняя навигационная панель */}
        <FixedLayout vertical="bottom">
          <Tabbar>
            <TabbarItem
              selected={activePanel === 'clicker'}
              onClick={() => setActivePanel('clicker')}
              text="Кликер"
            >
              <Icon28MoneyCircleOutline />
            </TabbarItem>
            <TabbarItem
              selected={activePanel === 'shop'}
              onClick={() => setActivePanel('shop')}
              text="Магазин"
            >
              <Icon28MarketOutline />
            </TabbarItem>
          </Tabbar>
        </FixedLayout>
      </SplitCol>
    </SplitLayout>
  );
}

export default App;
