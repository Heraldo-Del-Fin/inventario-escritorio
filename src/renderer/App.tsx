import type { JSX } from 'react'
import { HashRouter } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { AppRouter } from './router/AppRouter'

dayjs.locale('es')

export function App(): JSX.Element {
  return (
    <ConfigProvider locale={esES} theme={{ token: { colorPrimary: '#2563eb', borderRadius: 6 } }}>
      <AntdApp>
        <HashRouter>
          <AppRouter />
        </HashRouter>
      </AntdApp>
    </ConfigProvider>
  )
}
