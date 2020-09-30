$(document).ready(function(){
    //delete ticket
    $('.delete-ticket').on('click', function(e){
        $target = $(e.target);
        const id = $target.attr('tic-id');

        $.ajax({
            type:'DELETE',
            url:'/ticket/' + id,
            success: function(response){
                alert('Ticket with id: '+ id + ' Deleted!');
                window.location.href='/';
            },
            error: function(err){
                console.log(err);
            }
        })
    })
    //delete comment
    $('.delete-comment').on('click', function(e){
        $target = $(e.target);
        const id = $target.attr('com-id');
        
        $.ajax({
            type:'DELETE',
            url:'/comment/' + id,
            success: function(response){
                alert('Comment deleted!');
                window.location.href='/';
            },
            error: function(err){
                console.log(err);
            }
        })
    })
    

});