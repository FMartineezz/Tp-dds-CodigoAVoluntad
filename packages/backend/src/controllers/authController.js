export class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  verificarUsuario = async (req, res) => {
    const user = req.user;

    const estado = await this.authService.verificarUsuario(user);
    return res.status(200).json(estado);
  };
}
