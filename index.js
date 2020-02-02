const CANVAS_FG_ID = 'map_canvas_fg'
const CANVAS_BG_ID = 'map_canvas_bg'
const CANVAS_TMP_ID = 'map_canvas_tmp'
const IMAGE_BASEPATH = "/img"
let scale = 1
let dx = 0, dy = 0;

const missionId = 10155;
const mission = mission_info[missionId];

const mapImgName = `${IMAGE_BASEPATH}/map/` + mission.map_res_name + ".png";
const imgLoader = new ImgLoader();

const spot_img = {
    "spot1": "spot1US",
    "spot2": "spot2",
    "spot3": "spot3US",
    "spot5": "spot5",
    "spot6": "spot6",
    "spot7": "spot7",
    "random": "random",
    "radar": "radarUS",
    "closedap": "closedapUS",
    "closedhvap": "closedhvap"
};

imgLoader.add(mapImgName);
$.each(mission.spot_ids, (index, spot_id) => {
    var spot = spot_info[spot_id];

    var imagename;
    if (spot.random_get) {
      imagename = "random";
    } else if (spot.special_eft) {
      imagename = "radar";
    } else if (spot.active_cycle) {
      if (spot.type == 7)
        imagename = "closedhvap";
      else
        imagename = "closedap";
    } else {
      imagename = "spot" + spot.type;
    }
    imagename = spot_img[imagename] || imagename;
    imagename = `${IMAGE_BASEPATH}/spot/` + imagename + spot.belong + ".png";
    spot.imagename = imagename;
    imgLoader.add(imagename);

    });

const fgCanvas = document.getElementById(CANVAS_FG_ID);
const bgCanvas = document.getElementById(CANVAS_BG_ID);
const tmpCanvas = document.getElementById(CANVAS_TMP_ID);

$("#map_canvas_fg").width("100%")
$("#map_canvas_bg").width("100%").hide()
$("#map_canvas_tmp").width("100%").hide()

const width = Math.abs(mission.map_eff_width);
const height = Math.abs(mission.map_eff_height);
imgLoader.onload(() => {

    bgCanvas.width = width;
    bgCanvas.height = height;

    const scaleMin = fgCanvas.clientWidth / width;
    const displayWidth = width * scaleMin;
    const displayHeight = height * scaleMin;
    fgCanvas.width = displayWidth;
    fgCanvas.height = displayHeight;

    drawBgImage(bgCanvas);
    drawFgImage(fgCanvas);
  });


function drawBgImageHelper (ctx, bgImg, mission, x_src, y_src, x_scale, y_scale) {
    var w_all = mission.map_all_width;
    var h_all = mission.map_all_height;
    var w_chop = mission.map_eff_width;
    var h_chop = mission.map_eff_height;
    var x_off = mission.map_offset_x;
    var y_off = mission.map_offset_y;

    if (w_chop < 0) {
      w_chop = -w_chop;
      y_scale = -y_scale;
    }
    if (h_chop < 0) {
      h_chop = -h_chop;
      x_scale = -x_scale;
    }

    x_src = w_all * x_src;
    y_src = h_all * y_src;
    // w_src = w_all, h_src = h_all
    var x_dest = w_all * 3 / 2 + x_off - w_chop / 2;
    var y_dest = h_all * 3 / 2 - y_off - h_chop / 2;
    // w_dest = w_chop, h_dest = h_chop
    var x_inter = Math.max(x_dest, x_src);
    var y_inter = Math.max(y_dest, y_src);
    var w_inter = Math.min(x_dest + w_chop, x_src + w_all) - x_inter;
    var h_inter = Math.min(y_dest + h_chop, y_src + h_all) - y_inter;

    if (w_inter > 0 && h_inter > 0) {
      ctx.save();
      ctx.scale(x_scale, y_scale);

      var x_src_true = (x_inter % w_all);
      if (x_scale < 0) x_src_true = w_all - x_src_true - w_inter;
      x_src_true = x_src_true / w_all * bgImg.naturalWidth;

      var y_src_true = (y_inter % h_all);
      if (y_scale < 0) y_src_true = h_all - y_src_true - h_inter;
      y_src_true = y_src_true / h_all * bgImg.naturalHeight;

      var w_src_true = w_inter / w_all * bgImg.naturalWidth;
      var h_src_true = h_inter / h_all * bgImg.naturalHeight;

      var x_dest_true = (x_inter - x_dest) * x_scale;
      var y_dest_true = (y_inter - y_dest) * y_scale;
      var w_dest_true = w_inter * x_scale;
      var h_dest_true = h_inter * y_scale;

      ctx.drawImage(bgImg, x_src_true, y_src_true, w_src_true, h_src_true, x_dest_true, y_dest_true, w_dest_true, h_dest_true);
      ctx.restore();
    }
  }

function drawConnectionLine (ctx, x0, y0, x1, y1, number_of_ways) {
    ctx.save();
    ctx.shadowColor = "black";
    ctx.shadowBlur = 11;
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    if (number_of_ways == 2) {
      ctx.lineWidth = 25;
      ctx.setLineDash([75, 45]);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    } else if (number_of_ways == 1) {
      var dx = x1 - x0;
      var dy = y1 - y0;
      var dd = Math.sqrt(dx * dx + dy * dy);
      var w = 15; // width / 2
      var l = 30; // length
      var t = 30; // thickness
      ctx.lineWidth = 0;
      for (var ll = 0; ll < dd; ll += l * 2) {
        ctx.beginPath();
        ctx.moveTo(x0 + ll * dx / dd + w * dy / dd, y0 + ll * dy / dd - w * dx / dd);
        ctx.lineTo(x0 + (ll + t) * dx / dd + w * dy / dd, y0 + (ll + t) * dy / dd - w * dx / dd);
        ctx.lineTo(x0 + (ll + t + l) * dx / dd, y0 + (ll + t + l) * dy / dd);
        ctx.lineTo(x0 + (ll + t) * dx / dd - w * dy / dd, y0 + (ll + t) * dy / dd + w * dx / dd);
        ctx.lineTo(x0 + ll * dx / dd - w * dy / dd, y0 + ll * dy / dd + w * dx / dd);
        ctx.lineTo(x0 + (ll + l) * dx / dd, y0 + (ll + l) * dy / dd);
        ctx.fill();
      }
    } else {
      ctx.lineWidth = 25;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.restore();
  }

 function drawBgImage (canvas) {
    var ctx = canvas.getContext('2d');
    var bgImg = imgLoader.imgs[mapImgName];

    // multiply night color
    ctx.save();
    if (mission.special_type == 1)
      ctx.fillStyle = "#3B639F";
    else
      ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "multiply";

    // draw background
    drawBgImageHelper(ctx, bgImg, mission, 0, 0, -1, -1);
    drawBgImageHelper(ctx, bgImg, mission, 1, 0, 1, -1);
    drawBgImageHelper(ctx, bgImg, mission, 2, 0, -1, -1);
    drawBgImageHelper(ctx, bgImg, mission, 0, 1, -1, 1);
    drawBgImageHelper(ctx, bgImg, mission, 1, 1, 1, 1);
    drawBgImageHelper(ctx, bgImg, mission, 2, 1, -1, 1);
    drawBgImageHelper(ctx, bgImg, mission, 0, 2, -1, -1);
    drawBgImageHelper(ctx, bgImg, mission, 1, 2, 1, -1);
    drawBgImageHelper(ctx, bgImg, mission, 2, 2, -1, -1);

    ctx.restore();
    //건물 구분을 위한 타입 아이디 배열값
    var target_type = [5,10];



    // draw load
    $.each(mission.spot_ids, (index, spot_id) => {
      var spot = spot_info[spot_id];
      
      $.each(spot.route_types, (other_id, number_of_ways) => {
        drawConnectionLine(ctx, spot.coordinator_x, spot.coordinator_y,
          spot_info[other_id].coordinator_x, spot_info[other_id].coordinator_y, number_of_ways);
      });
    });
    
    $.each(mission.spot_ids, (index, spot_id) => {
      var spot = spot_info[spot_id];
      
      // draw spots
      var spotImg = imgLoader.imgs[spot.imagename];
      var w = spotImg.naturalWidth;
      var h = spotImg.naturalHeight;
      ctx.drawImage(spotImg, spot.coordinator_x - w / 2, spot.coordinator_y - h / 2);

     });
  }

  function drawFgImage (canvas) {


    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

    ctx.drawImage(
      bgCanvas,
      0, 0,
      width, height,
      0, 0,
      width * scale, height * scale,
    );



  }

  function setStartingPosition () {
    var margin = 250;

    // initial value
    scale = scaleMin;
    dx = 0;
    dy = 0;

    // find the useful area
    var xMin = this.width;
    var xMax = 0;
    var yMin = this.height;
    var yMax = 0;
    $.each(mission.spot_ids, (index, spot_id) => {
      var spot = spot_info[spot_id];
      xMin = Math.min(xMin, spot.coordinator_x);
      xMax = Math.max(xMax, spot.coordinator_x);
      yMin = Math.min(yMin, spot.coordinator_y);
      yMax = Math.max(yMax, spot.coordinator_y);
    });
    // add some margin
    xMin = Math.max(xMin - margin, 0);
    xMax = Math.min(xMax + margin, this.width);
    yMin = Math.max(yMin - margin, 0);
    yMax = Math.min(yMax + margin, this.height);

    // apply scaling & translation
    var w = xMax - xMin;
    var h = yMax - yMin;
    this.applyScale(Math.min(displayWidth / w, displayHeight / h), 0, 0);
    this.applyTranslation(-xMin, -yMin);
  }

function applyTranslation (dx, dy) {
    dx = Math.min(dx, 0);
    dx = Math.max(dx, this.displayWidth / this.scale - this.width);
    dy = Math.min(dy, 0);
    dy = Math.max(dy, this.displayHeight / this.scale - this.height);
    if (dx == this.dx && dy == this.dy)
      return false;

    this.dx = dx;
    this.dy = dy;
    return true;
  }

  function applyScale (scale, x, y) {
    scale = Math.min(scale, 1);
    scale = Math.max(scale, scaleMin);

    var dx2 = this.dx + x / scale - x / this.scale;
    var dy2 = this.dy + y / scale - y / this.scale;
    scale = scale;
    applyTranslation(dx2, dy2);
  }
