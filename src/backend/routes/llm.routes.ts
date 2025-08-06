import { Router } from 'express';
import { LLMController } from '../controllers/llm.controller';

const router = Router();

// Lazy initialization to ensure environment variables are loaded
let llmController: LLMController | null = null;

const getLLMController = () => {
  if (!llmController) {
    llmController = new LLMController();
  }
  return llmController;
};

router.post('/generate', (req, res) => getLLMController().generateDualResponse(req, res));
router.post('/stream', (req, res) => getLLMController().streamResponse(req, res));
router.get('/models', (req, res) => getLLMController().getModels(req, res));

export default router;