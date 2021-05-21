# 快速搭建模型服务器

以下介绍了如何基于 [docker](https://www.docker.com/) 搭建一个 [TorchServe](https://github.com/pytorch/serve) 模型服务器，您亦可参考 TorchServe [官方教程](https://github.com/pytorch/serve)

1. 安装 [docker](https://www.docker.com/)：使用以下命令安装docker或参考docker安装 [官方教程](https://docs.docker.com/get-docker/)

    ```bash
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
    ```
2. 若设备具有GPU，安装 [nvidia容器工具包](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#installing-on-ubuntu-and-debian) 以及 [驱动程序](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/install-nvidia-driver.html)

3. 准备模型及相关文件
    * 训练权重(.pt/.pth)
    * 模型描述文件
    * 输入输出处理程序
    * 其他必要的文件

    例如对于一个基于 [torchvision fcn_resnet_101_coco](https://pytorch.org/hub/pytorch_vision_fcn_resnet101/) 模型的图像分割网络，您需要准备:
    * [预训练权重](https://download.pytorch.org/models/fcn_resnet101_coco-7ecb50ca.pth)
    * [模型描述文件以及其他必要的文件](https://github.com/pytorch/serve/tree/master/examples/image_segmenter/fcn)

    将文件保存在您的工作目录下：
    ```
    /home/model-server
      |- model-store
      |     |- fcn_resnet101_coco-7ecb50ca.pth
      |- examples/image_segmenter/fcn
            |- fcn.py
            |- intermediate_layer_getter.py
            |- model.py
    ```

4. 在 /home/model-server 路径下启动 docker 容器
   ```bash
   sudo docker run --rm -it --privileged=true --gpus all -p 8080:8080 -p 8081:8081 --name mar -v $(pwd)/model-store:/home/model-server/model-store -v $(pwd)/examples:/home/model-server/examples  pytorch/torchserve:latest-gpu
   ```

5. 获取容器 bash
   ```bash
   sudo docker exec -u 0 -it mar /bin/bash
   ```

6. 执行 torch-model-archiver
   ```bash
   torch-model-archiver --model-name fcn_resnet_101 --version 1.0 --model-file /home/model-server/examples/image_segmenter/fcn/model.py --serialized-file /home/model-server/examples/image_segmenter/fcn_resnet101_coco-7ecb50ca.pth --handler image_segmenter --extra-files /home/model-server/examples/image_segmenter/fcn/fcn.py,/home/model-server/examples/image_segmenter/fcn/intermediate_layer_getter.py --export-path /home/model-server/model-store
   ```
7. 启动 torchserve
   ```bash
    torchserve --start --ncs --model-store /home/model-server/model-store --models fcn=fcn_resnet_101.mar
    ```

8. 测试服务，结果保存到 res.txt 文件中
    ```bash
    curl http://localhost:8080/predictions/fcn/1.0 -T /home/model-server/examples/image_segmenter/persons.jpg > res.txt
    ```