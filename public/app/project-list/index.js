angular
  .module('app')
  .controller('ProjectListController', Controller);

Controller.$inject = ['$scope', '$rootScope', '$location', '$routeParams', "Services"];

function Controller($scope, $rootScope, $location, $routeParams, Services){
    $scope.init = () => {
        Promise.all([
          Services.getProjects()
        ])
        .then( data => {
          $scope.projects = data[0].data;

          // It nessessory if we use `Promise.all` 
          // TODO: Switch to angularjs implementation of promises ($q)
          $scope.$digest();
        })
        .catch( err => {
          console.log(err);
        })
    }

    $scope.showprojectdialog = () => {
      $scope.project_name = null;
      $scope.project_description = null;
      $('#AddProjectDialog').modal('show');
    }

    $scope.createproject = () => {
      const project_name = $scope.project_name;
      const project_description = $scope.project_description;

      Services.newProject(project_name, project_description)
      .then( data => {
        $scope.init();
      })
      .catch( err => {
        console.log(err);
      })
    }

    $scope.toImages = (id) => {
      console.log(id);
      $location.path(`/project/${id}/images`);
      
    }
}