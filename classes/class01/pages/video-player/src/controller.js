
export default class Controller{
  #view;
  #service;
  #camera;
  #worker;
  #blinkCounter = 0;
  constructor({view, service, worker, camera}){
    this.#view = view;
    this.#camera = camera;
    this.#worker = this.#configureWorker(worker);

    this.#view.configureOnBtnClick(this.onBtnStart.bind(this));
  }

  static async initialize(deps){
    const controller = new Controller(deps);
    controller.log("not yet detecting eye blink");
    return controller.init();
  }

  #configureWorker(worker){
    let ready = false;
    worker.onmessage = ({ data }) => {
      console.log("Worker received message", data);
      if(data === "READY"){
        console.log("Worker is ready");
        this.#view.enableButton()
        ready = true;
        return;
      }
      const blinked = data.blinked;
      this.#blinkCounter += blinked;
      this.#view.touglePlayVideo()
      console.log("Blinked", blinked);
    }
    return {
      send (data){
        if(!ready) return;
        worker.postMessage(data);
      }
    };
  }

  async init(){
    console.log("Controller initialized");
  }

  loop(){
    const video = this.#camera.video;
    const img = this.#view.getVideoFrame(video);

    this.#worker.send(img);
    this.log(`Detecting eye blink: ${this.#blinkCounter}`);

    setTimeout(() => this.loop, 100);
  }

  log(text){
    const times = `  - blinked times: ${this.#blinkCounter}`
    this.#view.log(`status: ${times}`.concat(this.#blinkCounter ? times : ""));
  }

  onBtnStart(){
    this.log("initializing detecting eye blink");
    this.#blinkCounter = 0;
    this.loop();
  }
}
