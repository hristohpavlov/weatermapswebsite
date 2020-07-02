function footerAlign() {
    $('footer').css('display', 'block');
    $('footer').css('height', 'fit-content');
    var footerHeight = $('footer').outerHeight();
    $('body').css('padding-bottom', footerHeight);
    //    $('footer').css('height', footerHeight);
}

$(document).ready(function () {
    footerAlign();
    $('#loginModal').modal('show');
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })
});

$(window).resize(function () {
    footerAlign();
});

// Redirect to the details page with a query.
function goToDetails() {
    window.location.replace("/details?start=" + $('#departure').val() + "&waypoints=" + $('#waypoints').val() + "&destination=" + $('#arrival').val() + "&travelDate=" + $('#datetimepicker1').val());
}