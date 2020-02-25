angular
  .module('app')
  .factory('Services', Services);

Services.$inject = ['$http', '$q'];

function Services($http, $q){
    const base_url = '/api/v1';
    var imageStorage = [];
    var maskStorage = [];
    var classStorage = [];
    var stateStorage = {};

    return {
        //APIs
        getImages: (project_id) => {
            return $http({
                method: "GET",
                url: `${base_url}/get_images/${project_id}`
            })
        },
        getProjects: () => {
            return $http.get(`${base_url}/get_projects`)
        },
        newProject: (name, description) => {
            return $http.post(`${base_url}/new_project`, {"name": name, "description": description})
        },
        saveResult: ({project_id: project_id, data:data, masks: masks}) => {           
            return $http.post(`${base_url}/insert_image`, {project_id: project_id, image: data, masks: masks})
        },
        updateResult: ({project_id: project_id, image_id: image_id, data:data, masks: masks}) => {           
            return $http.post(`${base_url}/update_image`, {project_id: project_id, image_id: image_id, image: data, masks: masks})
        },
        //Storages
        imageStorage: imageStorage,
        maskStorage: maskStorage,
        classStorage: classStorage,
        stateStorage: stateStorage,
    };
};