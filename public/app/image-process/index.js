angular
  .module('app')
  .controller('ImageProcessController', Controller);

Controller.$inject = ['$scope', '$location', '$routeParams', 'Services', '$rootScope'];

function Controller($scope, $location, $routeParams, Services, $rootScope){

    // Used for ng-model in UI
    // Contains class object
    $scope.current = {};

    $scope.init = () => {
        $scope.index = $routeParams.index;
        $scope.image = Services.imageStorage[$scope.index];   
        $scope.masks = Services.maskStorage[$scope.index] || {};
        $scope.classes = Services.classStorage;  
        $scope.state = Services.stateStorage;   
    }

    $scope.$watch('masks', () => {
        Services.maskStorage[$scope.index] = $scope.masks;
    });

    $scope.$watch('current.changing', (oldVal, newVal) => {
        // Check to local unsaved changes and global unsaved changes
        // Global changes couldn't changed under background now and 
        // not needed get global state all the time
        window.onbeforeunload = (event, current, next) =>{
            if(newVal || $scope.state.unsaved_images){
                return 'Mask not saved';
            } else {
                undefined;
            }
        }
    });

    $rootScope.$on('$locationChangeStart', function( event ) {    
        if (!!$scope.current.changing == false) return;
        
        var answer = confirm('Mask not saved. Continue?');

        if (!answer) {
            event.preventDefault();
        } else { 
            $scope.current.changing = false;
        }
    });
    

    $scope.save = () => {
        $location.path(`/project/${$scope.project_id}/images`)
    }

    $scope.clear = () => {
        let ctx = $scope.ctx;
        let canvas = $scope.canvas;
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);        
    }

    $scope.setSize = (size) => {
        $scope.ctx.lineWidth = size;
    }

    $scope.setColor = (color) => {
        $scope.ctx.strokeStyle = color;
    }

    $scope.saveMask = () => {
        let class_name = $scope.current.class.class_name;
        let src = $scope.canvas.toDataURL();
        let w = $scope.canvas.width;
        let h = $scope.canvas.height;
        let imgdata = $scope.ctx.getImageData(0, 0, w, h);
        let arr = Array.from(imgdata.data);
        let d = []

        // 1D RGBA => 1D mask
        let _r, _g, _b, _a;
        for(let i =0; i <w*h*4; i +=4){
            [_r, _g, _b, _a] = arr.slice(i, i+4);
            d.push((_r + _g + _b + _a) == 0? 0: 1);
        }
        
        // 1D mask => 2D mask
        let b = [];
        for(var i = 0; i < w; i += 1){ 
            b.push(d.slice(i*w, i*w+h))
        }

        // Transform 2D mask
        let m = $scope.mask2rle(b.flat());
        let sm = Object.keys(m).reduce( (r, k) => r + ' ' + k + ' ' + m[k], '');
        sm = sm.trim();

        var data = {
            "src": src,
            "rle": sm,
            "width": w,
            "height": h,
            "class_name": class_name
        }
        $scope.masks[class_name] = data;
        $scope.current.changing = false;
        $scope.$digest();
    }

    $scope.loadMask = () => {
        let class_name = $scope.current.class.class_name;
        if($scope.masks[class_name]){
            var src = $scope.masks[class_name].src;
            var img = new Image;
            img.src = src;
            img.onload = (e) => {
                $scope.ctx.drawImage(img, 0, 0); 
            };        
        } else {
            // mask still empty
        }
    }

    $scope.changeClass = () => {
        if(!$scope.canvas){
            $scope.init_canvas();
        }
        $scope.setColor($scope.current.class.class_color);
        $scope.clear();
        $scope.loadMask();        
    }

    $scope.init_canvas = () => {
        
        var img = $('.img-edit')[0]
        let height = img.clientHeight;
        
        var canvas = $('.mask-canvas')[0];
        $scope.canvas = canvas;

        canvas.width = 500;
        canvas.height = height;
        
        canvas.offsetTop = img.offsetTop;
        canvas.offsetLeft = img.offsetLeft;
        $('canvas').css("top", img.offsetTop);
        $('canvas').css("left", img.offsetLeft);


        var ctx = canvas.getContext('2d');
        $scope.ctx = ctx;
        
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.strokeStyle = 'black';

        ctx.lineWidth = 15;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.globalAlpha = "1";
        
        var mouse = {};
        // DESCTOP
        canvas.addEventListener('mousemove', (e) => {
            let el = angular.element('canvas')[0];
            let rect = el.getBoundingClientRect();
            
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;         
            
        }, false);

        canvas.addEventListener('mousedown', function(e) {
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
        
            canvas.addEventListener('mousemove', onPaint, false);
        }, false);
        
        canvas.addEventListener('mouseup', function() {
            canvas.removeEventListener('mousemove', onPaint, false);
        }, false);
        
        var onPaint = function() {
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();

            if(!!$scope.current.changing == false){
                $scope.current.changing = true;
                $scope.$digest();
            }
        };
       
    }

    $scope.mask2rle = (a) => {
        result = {}
        for(let i = 0; i < a.length; i += 100){
            let iter =  a.slice(i, i+100);
            
            if(Math.max(...iter) == 0){
                continue;
            }
            
            for(const [j,x] of iter.entries()){
                if(x == 1){
                    if(last == undefined){
                        last = i+j;
                        result[last] = 0;
                    }
                    result[last] += 1;
                } else {
                    last = undefined;
                }
            }
        }
                
        return result;
        
    }

}

