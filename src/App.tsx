import { observer } from 'mobx-react-lite'
import { useStore } from './stores/context'
import styles from './App.module.css'

/**
 * Единственная пока страница приложения.
 * observer() подписывает компонент на изменения observable-полей стора.
 */
const App = observer(function App() {
  const { coffee } = useStore()

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{coffee.title}</h1>
    </main>
  )
})

export default App
