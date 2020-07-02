function openModalLink(event) {
    event.preventDefault();
    let link = $(event.target); // Get the element the function was called from
    $.ajax({
        url: link.attr("href"),
        type: link.attr("method"),
        data: {
            modal_data: link.attr("data"),
        },
        success: (result) => {
            $(".modal-content").html(result);
        },
    });
    $('#aModal').modal('show');
}