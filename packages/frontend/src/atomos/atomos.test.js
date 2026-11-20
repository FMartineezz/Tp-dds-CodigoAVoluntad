import { render, screen, fireEvent } from '@testing-library/react';
import { Button, Field, StatusBadge } from './index.js';
import { Alert } from '../moleculas';

describe('átomos del sistema de diseño', () => {
  test('Button en loading anuncia aria-busy y no dispara onClick', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Enviar</Button>);
    const btn = screen.getByRole('button', { name: /enviar/i });
    expect(btn).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('Button normal dispara onClick y es type=button (no envía forms por accidente)', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Ir</Button>);
    const btn = screen.getByRole('button', { name: 'Ir' });
    expect(btn).toHaveAttribute('type', 'button');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('Field conecta label, ayuda y error con aria', () => {
    render(<Field label="Email" hint="Tu correo" error="Email inválido" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Tu correo/);
    expect(input).toHaveAccessibleDescription(/Email inválido/);
  });

  test('StatusBadge muestra texto, no solo color', () => {
    render(<StatusBadge status="rechazada" />);
    expect(screen.getByText('Rechazada')).toBeInTheDocument();
  });

  test('Alert de error usa role=alert y los demás role=status', () => {
    render(<><Alert kind="error">Falló</Alert><Alert kind="success">Ok</Alert></>);
    expect(screen.getByRole('alert')).toHaveTextContent('Falló');
    expect(screen.getByRole('status')).toHaveTextContent('Ok');
  });
});
