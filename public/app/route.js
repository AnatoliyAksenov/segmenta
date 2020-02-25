angular
  .module('app')
  .config(Configuration);

Configuration.$inject = ['$routeProvider'];

function Configuration($routeProvider){
    $routeProvider
    .when('/projects', {
        templateUrl: 'project-list/index.html',
        controller: 'ProjectListController'
    })
    .when('/project/:id/images/', {
        templateUrl: 'image-list/index.html',
        controller: 'ImageListController'
    })
    .when('/image/:index', {
        templateUrl: 'image-process/index.html',
        controller: 'ImageProcessController'
    })
    .otherwise({
        redirectTo: '/projects'
    })
}