import 'dotenv/config'
import express, {Request, Response, Application} from  'express';

const app: Application = express();
const port: number = parseInt(process.env.PORT || '3001', 10);

app.get('/', (req: Request, res: Response) => {
    res.send('hello from backend')
});

app.listen(port, () => {
    console.log('backend listening at http://localhost:${port}');
});










