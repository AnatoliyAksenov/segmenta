angular
  .module('app')
  .controller('ImageListController', Controller);

Controller.$inject = ['$scope', '$rootScope', '$location', '$routeParams', "Services"];

function Controller($scope, $rootScope, $location, $routeParams, Services){

    $scope.init = () => {
        //in-browser images restore
        $scope.images = Services.imageStorage;
        $scope.masks = Services.maskStorage;
        $scope.classes = Services.classStorage;
        $scope.state = Services.stateStorage;
        $scope.project_id = $routeParams.id;

        Services.getImages($scope.project_id)
        .then( data => {
            const images = data.data.map( i => Object.assign(i, {saved: true}) );
            $scope.images = [...images, ...$scope.images];
        })
    }

    // Watching
    $scope.$watch('classes', () => {
        Services.classStorage = $scope.classes;
        console.log('clsasses state changed');
    }, true);


    $scope.$watch('masks', () => {
        Services.maskStorage = $scope.masks;
    }, true);
    

    $scope.$watch('images', () => {
        Services.imageStorage = $scope.images;
        console.log('images state changed');
        
        //$scope.$digest();    
    }, true);
    

    $scope.$watch('state', () => {
        Services.stateStorage = $scope.state;
        
        window.onbeforeunload = (event, current, next) =>{
            if($scope.images.filter( i => i.saved == false).length > 0){
                return 'Images not saved';
            } else {
                undefined;
            }
        }
    }, true);  


    var process_files = (files) => {
        for(var f of files){
            // Process only images
            if(!f.type.match('image.*')){
                continue;
            }

            var reader = new FileReader();

            reader.onload = ((file) => {
                return (evt) => {
                    Services.imageStorage.push({name: file.name, src: evt.target.result, type: file.type, size: file.size, lastModifiedDate: file.lastModifiedDate, saved: false});
                    //$scope.images.push({name: file.name, src: evt.target.result, type: file.type});
                }
            })(f);

            reader.readAsDataURL(f);
            $scope.state.unsaved_images = true;
        }
    }

    var handle_file_loading = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const dt = e.originalEvent.dataTransfer;
        const files = dt.files;
        process_files(files);
        if(imagecount){
            imagecount.innerText = `Files loaded: ${files.length}`;
        }
        $scope.$digest();
    }

    var handle_file_click = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const dt = e.delegateTarget;
        const files = dt.files;
        process_files(files);
        if(imagecount){
            imagecount.innerText = `Files loaded: ${files.length}`;
        }
        $scope.$digest();
    }

    var handle_drag_over = (e) => {
        e.stopPropagation();
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'copy';
      }

    $scope.openLoadImages = () => {
        $('#loadImagesDialog').on('hide.bs.modal', () => {
            console.log('hide window');
            $scope.init();
            $scope.calculateStat();
            $scope.$digest();
        });
        $('#loadImagesDialog').modal('show');
        $('#drop_zone').on('dragover', handle_drag_over);
        $('#drop_zone').on('drop', handle_file_loading);
        $('#filesselect').on('change', handle_file_click);

        $('#drop_zone').on('click', () => {
            $('#filesselect').click();
        })
        
    }

    $scope.gotoEdit = (index) => {
        $location.path(`/image/${index}`);
    }
    
    // Classes API
    $scope.addClass = () => {
        $scope.classes.push({"class_name": $scope.class_name, "class_color": $scope.class_color});
        
        $scope.class_name = "";
        $scope.class_color = "";
    }

    $scope.newClass = () => {
        $('#NewClassDialog').modal('show');
    }

    $scope.viewImage = ($index) => {
        $scope.imgview = $scope.images[$index];
        $scope.imgview.index = $index;
        const img = $('.img-thumbnail')[$index];
        $scope.imgview.naturalHeight = img.naturalHeight;
        $scope.imgview.naturalWidth = img.naturalWidth;

        $('#ViewImageDialog').modal('show');
        $('#ViewImageDialog').on('hide.bs.modal', () => {
            
            $scope.calculateStat();
            $scope.$digest();
        
        });
    }

    $scope.rotateClockwise = ($index) => {
        const res = drawRotate(true);
        safeSaveImg($index, res);
    }
    
    $scope.rotateCounterClockwise = ($index) => {
        const res = drawRotate(false);
        safeSaveImg($index, res);
    }

    var safeSaveImg = ($index, src) => {        
        const orig = $scope.images[$index].src;
        $scope.images[$index].src = src;
        
        //The original src would saved only once.
        if(!!$scope.images[$index].original_src){
            $scope.images[$index].original_src = orig;
        }        
    }

    var drawRotate = (clockwise) => {
        const degrees = clockwise == true? 90: -90;
        let canvas = $('<canvas />')[0];
        let img = $(".img-view")[0];
        
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        canvas.width = ih;
        canvas.height = iw;

        let ctx = canvas.getContext('2d');
        
        if(clockwise){
            ctx.translate(ih, 0);
        } else {
            ctx.translate(0, iw);
        }

        ctx.rotate(degrees*Math.PI/180);
        ctx.drawImage(img, 0, 0);
        
        let rotated = canvas.toDataURL();        
        img.src = rotated;
        return rotated;
    }

    $scope.calculateStat = () => {
        //data by image size
        const lst = $('.img-thumbnail').toArray().reduce( (res, e) => [...res, {"w": e.naturalWidth, "h": e.naturalHeight}], []);
        const diff = lst.reduce( (res, e) => res.findIndex( r => r.w == e.w && r.h == e.h) >= 0? res: [...res, e], []);
        const grp = diff.map( e => lst.reduce( (res, er) => er.w == e.w && er.h == e.h? res+1: res, 0));

        $scope.imgstat = diff.map( (e,i) => { 
            return {
                "w": e.w,
                "h": e.h,
                "lbl": e.w + ' x ' + e.h, 
                "count": grp[i],
                "has_couple": diff.reduce( (res, el) => el.w == e.h && el.h == e.w? res || true: res || false, false)
            } 
        });
        //$scope.$digest();
    }

    $scope.groupRotate = () => {
        pass;
    }

    const downloadBlob = (blob, filename) => {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
    }

    $scope.getProject = () => {
        var zip = JSZip();
        var imgsf = zip.folder('images');
        var masksf = zip.folder('masks');
        var csv_file = "filename, class, wxh, rle";

        for(const [i,v] of $scope.images.entries()){
            imgsf.file(v.name, v.src.split(',')[1], {base64: true});
            const masks = $scope.masks[i];
            for(const m in masks){
                const msk = masks[m];
                csv_file += `\n${v.name}, ${msk.class_name}, ${msk.width}x${msk.height}, ${msk.rle}`;
                masksf.file(`${v.name}_${msk.class_name}`, msk.src.split(',')[1], {base64: true});
            }
        }

        zip.file('masks.csv', csv_file);
        zip.generateAsync({type: 'blob'})
        .then( content => {
            downloadBlob(content, "project.zip");
        })
    }

    $scope.saveResult = ($index) => {
        const data = $scope.images[$index];
        const masks = $scope.masks[$index];
        const project_id = $scope.project_id;
        Services.saveResult({project_id: project_id, data:data, masks: masks})
        .then( data => {
            const result = data.data['result'] == 'OK';
            const image_id = data.data['image_id'];

            if (result){
                $scope.images[$index].saved = true;
                $scope.images[$index].image_id = image_id;
                console.log('Image saved. ' + $index);
            } else {
                console.log(data.data);
            }
        })    
    }
}