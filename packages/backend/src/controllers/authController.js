export class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  verificarUsuario = async (req, res) => {
    const keycloakId = req.user.id;

    const estado = await this.authService.verificarUsuario(keycloakId);
    console.log(estado)
    return res.status(200).json(estado);
  };
}
