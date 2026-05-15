============================================
  Nexus Flux Studio — 模型放置说明
============================================

每个子文件夹代表一个 Flux 模型，需包含以下 4 个必需组件:

  [模型名]/
    transformer/diffusion_pytorch_model.safetensors  (~16 GB)
    text_encoder/model.safetensors                   (CLIP-L)
    text_encoder_2/model.safetensors                 (T5-XXL BF16)
    vae/diffusion_pytorch_model.safetensors
    scheduler/scheduler_config.json                 (可选但推荐)

示例结构:
  models/flux/
    flux-dev/
      transformer/diffusion_pytorch_model.safetensors
      text_encoder/model.safetensors
      text_encoder_2/model.safetensors
      vae/diffusion_pytorch_model.safetensors
      scheduler/scheduler_config.json

缺少任一组件时，启动后左侧面板会显示黄色警告并列出缺失项。
