interface TrainingConfig {
  batchSize: number;
  epochs: number;
  learningRate: number;
  validationSplit: number;
  modelType: 'component' | 'style' | 'layout';
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
}

interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
}

export class MLTraining {
  private static instance: MLTraining;
  private isTraining = false;
  private currentProgress = 0;
  private callbacks: ((progress: number) => void)[] = [];

  private constructor() {}

  static getInstance(): MLTraining {
    if (!MLTraining.instance) {
      MLTraining.instance = new MLTraining();
    }
    return MLTraining.instance;
  }

  async trainModel(
    data: any[],
    config: TrainingConfig,
    progressCallback?: (progress: number) => void
  ): Promise<ModelMetrics> {
    if (this.isTraining) {
      throw new Error('Training is already in progress');
    }

    try {
      this.isTraining = true;
      this.currentProgress = 0;
      if (progressCallback) {
        this.callbacks.push(progressCallback);
      }

      // Prepare data
      const { trainData, valData } = this.prepareData(data, config.validationSplit);
      
      // Train model based on type
      const metrics = await this.trainByType(config.modelType, trainData, valData, config);

      return metrics;
    } finally {
      this.isTraining = false;
      this.callbacks = [];
    }
  }

  private prepareData(data: any[], validationSplit: number) {
    const splitIndex = Math.floor(data.length * (1 - validationSplit));
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return {
      trainData: shuffled.slice(0, splitIndex),
      valData: shuffled.slice(splitIndex),
    };
  }

  private async trainByType(
    type: TrainingConfig['modelType'],
    trainData: any[],
    valData: any[],
    config: TrainingConfig
  ): Promise<ModelMetrics> {
    const metrics: TrainingMetrics[] = [];
    const totalSteps = config.epochs * Math.ceil(trainData.length / config.batchSize);
    let currentStep = 0;

    for (let epoch = 0; epoch < config.epochs; epoch++) {
      // Simulate epoch training
      const epochMetrics = await this.trainEpoch(trainData, valData, config);
      metrics.push(epochMetrics);

      currentStep += Math.ceil(trainData.length / config.batchSize);
      this.updateProgress(currentStep / totalSteps);
    }

    return this.calculateFinalMetrics(metrics);
  }

  private async trainEpoch(
    trainData: any[],
    valData: any[],
    config: TrainingConfig
  ): Promise<TrainingMetrics> {
    // Simulate epoch training with random metrics
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      epoch: metrics.length + 1,
      loss: Math.random() * 0.5,
      accuracy: 0.7 + Math.random() * 0.2,
      valLoss: Math.random() * 0.5,
      valAccuracy: 0.7 + Math.random() * 0.2,
    };
  }

  private calculateFinalMetrics(metrics: TrainingMetrics[]): ModelMetrics {
    const lastMetrics = metrics[metrics.length - 1];
    return {
      accuracy: lastMetrics.accuracy,
      precision: 0.8 + Math.random() * 0.1,
      recall: 0.8 + Math.random() * 0.1,
      f1Score: 0.8 + Math.random() * 0.1,
      confusionMatrix: [
        [85, 15],
        [10, 90],
      ],
    };
  }

  private updateProgress(progress: number) {
    this.currentProgress = progress;
    this.callbacks.forEach(callback => callback(progress));
  }

  getProgress(): number {
    return this.currentProgress;
  }

  isModelTraining(): boolean {
    return this.isTraining;
  }
}
