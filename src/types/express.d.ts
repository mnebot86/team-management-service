declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      team?: ITeam;
    }
  }
}
