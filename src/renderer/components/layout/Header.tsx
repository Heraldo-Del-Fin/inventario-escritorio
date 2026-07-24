import type { JSX } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Dropdown, type MenuProps } from 'antd'
import {
  BarChartOutlined,
  DownOutlined,
  LogoutOutlined,
  SafetyOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'

export function Header(): JSX.Element {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout(): void {
    logout()
    navigate('/login', { replace: true })
  }

  const items: MenuProps['items'] = [
    { key: 'reportes', label: 'Reportes', icon: <BarChartOutlined /> },
    ...(usuario?.rol === 'ADMIN'
      ? [{ key: 'administrador', label: 'Administrador', icon: <SafetyOutlined /> }]
      : []),
    { key: 'ajustes', label: 'Ajustes', icon: <SettingOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Cerrar sesión', icon: <LogoutOutlined />, danger: true }
  ]

  function handleMenuClick({ key }: { key: string }): void {
    if (key === 'reportes') navigate('/reportes')
    else if (key === 'administrador') navigate('/configuracion/usuarios')
    else if (key === 'ajustes') navigate('/configuracion')
    else if (key === 'logout') handleLogout()
  }

  return (
    <header className="app-header">
      <Link to="/" className="app-header-brand">
        Inventario Escritorio
      </Link>
      <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['click']}>
        <button type="button" className="app-header-user">
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{usuario?.nombre ?? 'Invitado'}</span>
          <DownOutlined style={{ fontSize: 10 }} />
        </button>
      </Dropdown>
    </header>
  )
}
