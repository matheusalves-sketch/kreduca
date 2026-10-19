(function () {
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || typeof Motion === 'undefined') {

    return;
  }

  var useRef = React.useRef;
  var useEffect = React.useEffect;
  var useCallback = React.useCallback;
  var createElement = React.createElement;
  var useMotionValue = Motion.useMotionValue;
  var useInView = Motion.useInView;
  var animate = Motion.animate;

  function CountUp(props) {
    var to = props.to;
    var from = props.from === undefined ? 0 : props.from;
    var direction = props.direction || 'up';
    var delay = props.delay || 0;
    var duration = props.duration || 2;
    var className = props.className || '';
    var startWhen = props.startWhen === undefined ? true : props.startWhen;
    var separator = props.separator || '';
    var onStart = props.onStart;
    var onEnd = props.onEnd;

    var ref = useRef(null);
    var motionValue = useMotionValue(direction === 'down' ? to : from);

    var isInView = useInView(ref, { once: true, margin: '0px' });

    function getDecimalPlaces(num) {
      var str = num.toString();
      if (str.indexOf('.') !== -1) {
        var decimals = str.split('.')[1];
        if (parseInt(decimals, 10) !== 0) {
          return decimals.length;
        }
      }
      return 0;
    }

    var maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

    var formatValue = useCallback(
      function (latest) {
        var hasDecimals = maxDecimals > 0;
        var options = {
          useGrouping: !!separator,
          minimumFractionDigits: hasDecimals ? maxDecimals : 0,
          maximumFractionDigits: hasDecimals ? maxDecimals : 0
        };
        var formattedNumber = new Intl.NumberFormat('en-US', options).format(latest);
        return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
      },
      [maxDecimals, separator]
    );

    useEffect(function () {
      if (ref.current) {
        ref.current.textContent = formatValue(direction === 'down' ? to : from);
      }
    }, [from, to, direction, formatValue]);

    useEffect(function () {
      if (isInView && startWhen) {
        if (typeof onStart === 'function') onStart();

        var controls;
        var timeoutId = setTimeout(function () {
          controls = animate(motionValue, direction === 'down' ? from : to, {
            duration: duration,
            ease: 'linear',
            onComplete: function () {
              if (typeof onEnd === 'function') onEnd();
            }
          });
        }, delay * 1000);

        return function () {
          clearTimeout(timeoutId);
          if (controls) controls.stop();
        };
      }
    }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

    useEffect(function () {
      var unsubscribe = motionValue.on('change', function (latest) {
        if (ref.current) {
          ref.current.textContent = formatValue(latest);
        }
      });
      return function () { unsubscribe(); };
    }, [motionValue, formatValue]);

    return createElement('span', { className: className, ref: ref });
  }

  function mount(el, prefix, suffix, countProps) {
    if (!el) return;
    var root = ReactDOM.createRoot(el);
    root.render(
      createElement(
        React.Fragment,
        null,
        prefix || null,
        createElement(CountUp, countProps),
        suffix || null
      )
    );
  }

  function initReactCountUps() {

    var metricEls = document.querySelectorAll('[data-cu="m"] [data-countup-to]');
    metricEls.forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-countup-to'));
      var prefix = el.getAttribute('data-countup-prefix') || null;
      var suffix = el.getAttribute('data-countup-suffix') || null;
      var separator = el.getAttribute('data-countup-separator') || '';
      mount(el, prefix, suffix, { from: 0, to: to, separator: separator, duration: 0.9 });
    });

    document.querySelectorAll('[data-cu="p"]').forEach(function (priceWrapper) {
      var intEl = priceWrapper.querySelector('.price-countup-int');
      var centsEl = priceWrapper.querySelector('.price-countup-cents');
      mount(intEl, null, null, { from: 0, to: 297, duration: 0.7 });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReactCountUps);
  } else {
    initReactCountUps();
  }
})();
